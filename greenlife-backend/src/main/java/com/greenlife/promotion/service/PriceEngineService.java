package com.greenlife.promotion.service;

import com.greenlife.exception.CustomException;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import com.greenlife.promotion.dto.PromotionPriceRequest;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionProduct;
import com.greenlife.promotion.entity.PromotionStore;
import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PriceEngineService {

    private final PromotionRepository promotionRepository;
    private final PromotionStoreRepository promotionStoreRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final Clock clock;

    private LocalDateTime getNow() {
        return LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
    }

    @Transactional(readOnly = true)
    public List<PromotionPriceQuote> calculatePrices(List<PromotionPriceRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }

        for (PromotionPriceRequest request : requests) {
            if (request.baseUnitPrice() == null || request.baseUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new CustomException("Giá bán sản phẩm không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            if (request.quantity() == null || request.quantity() < 1) {
                throw new CustomException("Số lượng sản phẩm yêu cầu tối thiểu phải bằng 1", HttpStatus.BAD_REQUEST);
            }
        }

        LocalDateTime quotedAt = getNow();

        // 1. Fetch active promotions (ordered by priority desc, id asc)
        List<Promotion> activePromotions = promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE);

        // If no active promotions, map all requests directly to base price quotes
        if (activePromotions.isEmpty()) {
            return requests.stream()
                .map(r -> createBasePriceQuote(r, quotedAt))
                .collect(Collectors.toList());
        }

        // 2. Bounded batch query: load mappings only for these active promotion IDs
        List<Integer> activePromoIds = activePromotions.stream().map(Promotion::getId).collect(Collectors.toList());
        List<PromotionStore> storeMappings = promotionStoreRepository.findAllByPromotionIdIn(activePromoIds);
        List<PromotionProduct> productMappings = promotionProductRepository.findAllByPromotionIdIn(activePromoIds);

        // Group mappings by promotion ID
        Map<Integer, Set<Integer>> storeIdsByPromo = storeMappings.stream()
            .collect(Collectors.groupingBy(
                m -> m.getPromotion().getId(),
                Collectors.mapping(m -> m.getStore().getId(), Collectors.toSet())
            ));

        Map<Integer, Set<Integer>> plantIdsByPromo = productMappings.stream()
            .collect(Collectors.groupingBy(
                m -> m.getPromotion().getId(),
                Collectors.mapping(m -> m.getPlant().getId(), Collectors.toSet())
            ));

        // Initialize in-memory remaining budget map for batch budget safety (Step 3)
        Map<Integer, BigDecimal> remainingBudgetMap = new HashMap<>();
        for (Promotion p : activePromotions) {
            BigDecimal budgetVal = p.getBudget() != null ? p.getBudget() : BigDecimal.ZERO;
            BigDecimal reservedVal = p.getReservedBudget() != null ? p.getReservedBudget() : BigDecimal.ZERO;
            BigDecimal consumedVal = p.getConsumedBudget() != null ? p.getConsumedBudget() : BigDecimal.ZERO;
            BigDecimal availableBudget = budgetVal.subtract(reservedVal).subtract(consumedVal);
            remainingBudgetMap.put(p.getId(), availableBudget.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : availableBudget);
        }

        List<PromotionPriceQuote> quotes = new ArrayList<>(requests.size());

        for (PromotionPriceRequest request : requests) {
            // Validation: Base price must be non-null and non-negative
            if (request.baseUnitPrice() == null || request.baseUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new CustomException("Giá bán sản phẩm không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            // Quantity must be at least 1
            if (request.quantity() == null || request.quantity() < 1) {
                throw new CustomException("Số lượng sản phẩm yêu cầu tối thiểu phải bằng 1", HttpStatus.BAD_REQUEST);
            }

            // Find and sort eligible promotions for this request
            List<PromotionCandidate> candidates = new ArrayList<>();
            for (Promotion p : activePromotions) {
                boolean eligible = false;
                int specificity = 0;

                if (p.getScopeType() == PromotionScopeType.GLOBAL) {
                    eligible = true;
                    specificity = 1;
                } else if (p.getScopeType() == PromotionScopeType.STORE) {
                    if (request.storeId() != null && storeIdsByPromo.getOrDefault(p.getId(), Collections.emptySet()).contains(request.storeId())) {
                        eligible = true;
                        specificity = 2;
                    }
                } else if (p.getScopeType() == PromotionScopeType.PRODUCT) {
                    if (request.plantId() != null && plantIdsByPromo.getOrDefault(p.getId(), Collections.emptySet()).contains(request.plantId())) {
                        eligible = true;
                        specificity = 3;
                    }
                }

                if (eligible) {
                    candidates.add(new PromotionCandidate(p, specificity));
                }
            }

            // Sort candidates: 1. Priority DESC, 2. Specificity DESC, 3. Promotion ID ASC
            candidates.sort((c1, c2) -> {
                int cmp = Integer.compare(c2.promotion.getPriority(), c1.promotion.getPriority());
                if (cmp != 0) return cmp;
                cmp = Integer.compare(c2.specificity, c1.specificity);
                if (cmp != 0) return cmp;
                return Integer.compare(c1.promotion.getId(), c2.promotion.getId());
            });

            PromotionPriceQuote appliedQuote = null;
            for (PromotionCandidate candidate : candidates) {
                Promotion p = candidate.promotion;

                // Budget validation using safe zero semantics
                BigDecimal budgetVal = p.getBudget() != null ? p.getBudget() : BigDecimal.ZERO;
                BigDecimal reservedVal = p.getReservedBudget() != null ? p.getReservedBudget() : BigDecimal.ZERO;
                BigDecimal consumedVal = p.getConsumedBudget() != null ? p.getConsumedBudget() : BigDecimal.ZERO;

                // Skip corrupted budget state
                if (budgetVal.compareTo(BigDecimal.ZERO) < 0 ||
                    reservedVal.compareTo(BigDecimal.ZERO) < 0 ||
                    consumedVal.compareTo(BigDecimal.ZERO) < 0) {
                    continue;
                }

                BigDecimal availableBudget = remainingBudgetMap.getOrDefault(p.getId(), BigDecimal.ZERO);

                // Calculate discount
                BigDecimal rawDiscount = BigDecimal.ZERO;
                if (p.getDiscountType() == PromotionDiscountType.PERCENTAGE) {
                    rawDiscount = request.baseUnitPrice().multiply(p.getDiscountValue())
                        .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                } else if (p.getDiscountType() == PromotionDiscountType.FIXED) {
                    rawDiscount = p.getDiscountValue().setScale(0, RoundingMode.HALF_UP);
                }

                BigDecimal unitDiscount = rawDiscount;
                if (p.getMaxDiscountAmount() != null) {
                    BigDecimal maxDiscountVal = p.getMaxDiscountAmount().setScale(0, RoundingMode.HALF_UP);
                    unitDiscount = unitDiscount.min(maxDiscountVal);
                }

                // Enforce 0 <= unitDiscount <= baseUnitPrice
                if (unitDiscount.compareTo(BigDecimal.ZERO) < 0) {
                    unitDiscount = BigDecimal.ZERO;
                }
                if (unitDiscount.compareTo(request.baseUnitPrice()) > 0) {
                    unitDiscount = request.baseUnitPrice();
                }

                BigDecimal requiredBudget = unitDiscount.multiply(BigDecimal.valueOf(request.quantity())).setScale(0, RoundingMode.HALF_UP);

                // Check budget eligibility
                if (availableBudget.compareTo(requiredBudget) >= 0) {
                    // Deduct budget in-memory
                    remainingBudgetMap.put(p.getId(), availableBudget.subtract(requiredBudget));

                    BigDecimal effectiveUnitPrice = request.baseUnitPrice().subtract(unitDiscount);

                    BigDecimal platformFundedUnitDiscount = unitDiscount.multiply(p.getPlatformFundingRatio() != null ? p.getPlatformFundingRatio() : BigDecimal.ZERO)
                        .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                    BigDecimal storeFundedUnitDiscount = unitDiscount.subtract(platformFundedUnitDiscount);

                    BigDecimal lineBaseAmount = request.baseUnitPrice().multiply(BigDecimal.valueOf(request.quantity())).setScale(0, RoundingMode.HALF_UP);
                    BigDecimal lineEffectiveAmount = effectiveUnitPrice.multiply(BigDecimal.valueOf(request.quantity())).setScale(0, RoundingMode.HALF_UP);
                    BigDecimal lineDiscountAmount = requiredBudget;

                    BigDecimal platformFundedLineDiscount = platformFundedUnitDiscount.multiply(BigDecimal.valueOf(request.quantity())).setScale(0, RoundingMode.HALF_UP);
                    BigDecimal storeFundedLineDiscount = lineDiscountAmount.subtract(platformFundedLineDiscount);

                    appliedQuote = new PromotionPriceQuote(
                        request.plantId(),
                        request.storeId(),
                        request.quantity(),
                        request.baseUnitPrice().setScale(0, RoundingMode.HALF_UP),
                        effectiveUnitPrice,
                        unitDiscount,
                        lineBaseAmount,
                        lineEffectiveAmount,
                        lineDiscountAmount,
                        storeFundedUnitDiscount,
                        platformFundedUnitDiscount,
                        storeFundedLineDiscount,
                        platformFundedLineDiscount,
                        true, // onSale
                        p.getId(),
                        p.getName(),
                        p.getFundingSource(),
                        quotedAt
                    );
                    break; // Apply at most one promotion, stop searching
                }
            }

            if (appliedQuote != null) {
                quotes.add(appliedQuote);
            } else {
                quotes.add(createBasePriceQuote(request, quotedAt));
            }
        }

        return quotes;
    }

    private PromotionPriceQuote createBasePriceQuote(PromotionPriceRequest request, LocalDateTime quotedAt) {
        BigDecimal baseUnitPrice = request.baseUnitPrice().setScale(0, RoundingMode.HALF_UP);
        BigDecimal lineBaseAmount = baseUnitPrice.multiply(BigDecimal.valueOf(request.quantity())).setScale(0, RoundingMode.HALF_UP);

        return new PromotionPriceQuote(
            request.plantId(),
            request.storeId(),
            request.quantity(),
            baseUnitPrice,
            baseUnitPrice, // effectiveUnitPrice
            BigDecimal.ZERO, // unitDiscount
            lineBaseAmount,
            lineBaseAmount, // lineEffectiveAmount
            BigDecimal.ZERO, // lineDiscountAmount
            BigDecimal.ZERO, // storeFundedUnitDiscount
            BigDecimal.ZERO, // platformFundedUnitDiscount
            BigDecimal.ZERO, // storeFundedLineDiscount
            BigDecimal.ZERO, // platformFundedLineDiscount
            false, // onSale
            null, // promotionId
            null, // promotionName
            null, // fundingSource
            quotedAt
        );
    }

    private static class PromotionCandidate {
        final Promotion promotion;
        final int specificity;

        PromotionCandidate(Promotion promotion, int specificity) {
            this.promotion = promotion;
            this.specificity = specificity;
        }
    }
}
