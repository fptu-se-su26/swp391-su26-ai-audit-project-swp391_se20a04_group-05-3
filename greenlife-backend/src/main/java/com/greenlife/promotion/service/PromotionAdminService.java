package com.greenlife.promotion.service;

import com.greenlife.exception.CustomException;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.dto.*;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionAuditHistory;
import com.greenlife.promotion.entity.PromotionProduct;
import com.greenlife.promotion.entity.PromotionProductId;
import com.greenlife.promotion.entity.PromotionStore;
import com.greenlife.promotion.entity.PromotionStoreId;
import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.repository.PromotionAuditHistoryRepository;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.store.entity.Store;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionAdminService {

    private final PromotionRepository promotionRepository;
    private final PromotionStoreRepository promotionStoreRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final PromotionAuditHistoryRepository promotionAuditHistoryRepository;
    private final StoreRepository storeRepository;
    private final PlantRepository plantRepository;
    private final CurrentUserResolver currentUserResolver;
    private final Clock clock;

    private User resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails userDetails)) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        User actor = currentUserResolver.resolveUser(userDetails);
        if (actor == null || actor.getRole() == null || !"ADMIN".equalsIgnoreCase(actor.getRole().getName())) {
            throw new CustomException("Chỉ ADMIN mới có quyền thực hiện hành động này", HttpStatus.FORBIDDEN);
        }
        return actor;
    }

    private LocalDateTime getNow() {
        return LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
    }

    private String normalizeAndValidateReason(String reason, boolean optional) {
        if (reason == null) {
            return null;
        }
        String trimmed = reason.trim();
        if (trimmed.isEmpty()) {
            if (optional) {
                return null;
            } else {
                throw new CustomException("Lý do không được để trống", HttpStatus.BAD_REQUEST);
            }
        }
        if (trimmed.length() > 250) {
            throw new CustomException("Lý do không được vượt quá 250 ký tự", HttpStatus.BAD_REQUEST);
        }
        return trimmed;
    }

    private void validateRequest(
        String name,
        PromotionScopeType scopeType,
        PromotionDiscountType discountType,
        BigDecimal discountValue,
        BigDecimal maxDiscountAmount,
        PromotionFundingSource fundingSource,
        BigDecimal platformFundingRatio,
        BigDecimal storeFundingRatio,
        Integer priority,
        BigDecimal budget,
        List<Integer> storeIds,
        List<Integer> productIds
    ) {
        // A. Discount value
        if (discountValue == null) {
            throw new CustomException("Giá trị giảm giá không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (discountValue.compareTo(BigDecimal.ONE) < 0) {
            throw new CustomException("Giá trị giảm giá phải lớn hơn hoặc bằng 1", HttpStatus.BAD_REQUEST);
        }
        if (discountValue.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
            throw new CustomException("Giá trị giảm giá phải là số nguyên", HttpStatus.BAD_REQUEST);
        }

        if (discountType == PromotionDiscountType.PERCENTAGE) {
            if (discountValue.compareTo(new BigDecimal("100")) > 0) {
                throw new CustomException("Giá trị giảm giá theo phần trăm không được vượt quá 100", HttpStatus.BAD_REQUEST);
            }
        }

        if (maxDiscountAmount != null) {
            if (maxDiscountAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new CustomException("Giới hạn giảm giá tối đa phải lớn hơn 0", HttpStatus.BAD_REQUEST);
            }
            if (maxDiscountAmount.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
                throw new CustomException("Giới hạn giảm giá tối đa phải là số nguyên", HttpStatus.BAD_REQUEST);
            }
        }

        // B. Ratios
        if (fundingSource == null) {
            throw new CustomException("Nguồn tài trợ không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (platformFundingRatio == null || storeFundingRatio == null) {
            throw new CustomException("Tỷ lệ tài trợ không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (platformFundingRatio.stripTrailingZeros().scale() > 2 || storeFundingRatio.stripTrailingZeros().scale() > 2) {
            throw new CustomException("Tỷ lệ tài trợ tối đa chỉ được chứa 2 chữ số thập phân", HttpStatus.BAD_REQUEST);
        }
        BigDecimal sum = platformFundingRatio.add(storeFundingRatio);
        if (sum.compareTo(new BigDecimal("100")) != 0) {
            throw new CustomException("Tổng tỷ lệ tài trợ phải bằng 100%", HttpStatus.BAD_REQUEST);
        }

        if (fundingSource == PromotionFundingSource.PLATFORM_FUNDED) {
            if (platformFundingRatio.compareTo(new BigDecimal("100")) != 0 || storeFundingRatio.compareTo(BigDecimal.ZERO) != 0) {
                throw new CustomException("Tỷ lệ tài trợ của nhà vườn không hợp lệ khi nền tảng tài trợ 100%", HttpStatus.BAD_REQUEST);
            }
        } else if (fundingSource == PromotionFundingSource.STORE_FUNDED) {
            if (storeFundingRatio.compareTo(new BigDecimal("100")) != 0 || platformFundingRatio.compareTo(BigDecimal.ZERO) != 0) {
                throw new CustomException("Tỷ lệ tài trợ của nền tảng không hợp lệ khi nhà vườn tài trợ 100%", HttpStatus.BAD_REQUEST);
            }
        } else if (fundingSource == PromotionFundingSource.CO_FUNDED) {
            if (platformFundingRatio.compareTo(BigDecimal.ZERO) <= 0 || storeFundingRatio.compareTo(BigDecimal.ZERO) <= 0) {
                throw new CustomException("Tỷ lệ tài trợ của nền tảng và nhà vườn phải lớn hơn 0 khi đồng tài trợ", HttpStatus.BAD_REQUEST);
            }
        }

        // C. Priority and budget
        if (priority == null || priority < 0) {
            throw new CustomException("Độ ưu tiên phải lớn hơn hoặc bằng 0", HttpStatus.BAD_REQUEST);
        }
        if (budget == null) {
            throw new CustomException("Ngân sách không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (budget.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Ngân sách phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }
        if (budget.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
            throw new CustomException("Ngân sách phải là số nguyên", HttpStatus.BAD_REQUEST);
        }
        if (budget.compareTo(new BigDecimal("999999999999")) > 0) {
            throw new CustomException("Ngân sách vượt quá giới hạn tối đa", HttpStatus.BAD_REQUEST);
        }

        // D. Targets
        if (storeIds != null && storeIds.size() != new HashSet<>(storeIds).size()) {
            throw new CustomException("Danh sách nhà vườn chứa phần tử trùng lặp", HttpStatus.BAD_REQUEST);
        }
        if (productIds != null && productIds.size() != new HashSet<>(productIds).size()) {
            throw new CustomException("Danh sách sản phẩm chứa phần tử trùng lặp", HttpStatus.BAD_REQUEST);
        }

        if (scopeType == PromotionScopeType.GLOBAL) {
            if ((storeIds != null && !storeIds.isEmpty()) || (productIds != null && !productIds.isEmpty())) {
                throw new CustomException("Khuyến mãi toàn sàn không được chứa danh sách nhà vườn hoặc sản phẩm", HttpStatus.BAD_REQUEST);
            }
        } else if (scopeType == PromotionScopeType.STORE) {
            if (storeIds == null || storeIds.isEmpty()) {
                throw new CustomException("Khuyến mãi cấp cửa hàng phải chứa ít nhất một nhà vườn", HttpStatus.BAD_REQUEST);
            }
            if (productIds != null && !productIds.isEmpty()) {
                throw new CustomException("Khuyến mãi cấp cửa hàng không được chứa danh sách sản phẩm", HttpStatus.BAD_REQUEST);
            }
        } else if (scopeType == PromotionScopeType.PRODUCT) {
            if (productIds == null || productIds.isEmpty()) {
                throw new CustomException("Khuyến mãi cấp sản phẩm phải chứa ít nhất một sản phẩm", HttpStatus.BAD_REQUEST);
            }
            if (storeIds != null && !storeIds.isEmpty()) {
                throw new CustomException("Khuyến mãi cấp sản phẩm không được chứa danh sách nhà vườn", HttpStatus.BAD_REQUEST);
            }
        }
    }

    private void resolveAndValidateTargets(
        PromotionScopeType scopeType,
        List<Integer> storeIds,
        List<Integer> productIds
    ) {
        if (scopeType == PromotionScopeType.STORE) {
            List<Store> fetched = storeRepository.findAllById(storeIds);
            Set<Integer> fetchedIds = fetched.stream().map(Store::getId).collect(Collectors.toSet());
            List<Integer> missing = storeIds.stream().filter(id -> !fetchedIds.contains(id)).toList();
            if (!missing.isEmpty()) {
                throw new CustomException("Không tìm thấy các nhà vườn với ID: " + missing, HttpStatus.NOT_FOUND);
            }
            for (Store s : fetched) {
                if (s.getStatus() != StoreStatus.APPROVED) {
                    throw new CustomException("Cửa hàng " + s.getName() + " chưa được duyệt", HttpStatus.BAD_REQUEST);
                }
            }
        } else if (scopeType == PromotionScopeType.PRODUCT) {
            List<Plant> fetched = plantRepository.findAllById(productIds);
            Set<Integer> fetchedIds = fetched.stream().map(Plant::getId).collect(Collectors.toSet());
            List<Integer> missing = productIds.stream().filter(id -> !fetchedIds.contains(id)).toList();
            if (!missing.isEmpty()) {
                throw new CustomException("Không tìm thấy các sản phẩm với ID: " + missing, HttpStatus.NOT_FOUND);
            }
            for (Plant p : fetched) {
                if (p.getStatus() != PlantStatus.ACTIVE) {
                    throw new CustomException("Sản phẩm " + p.getName() + " không hoạt động", HttpStatus.BAD_REQUEST);
                }
                if (p.getStore() == null || p.getStore().getStatus() != StoreStatus.APPROVED) {
                    throw new CustomException("Cửa hàng của sản phẩm " + p.getName() + " chưa được duyệt", HttpStatus.BAD_REQUEST);
                }
            }
        }
    }

    @Transactional
    public PromotionDetailResponse createDraft(CreatePromotionRequest request) {
        User actor = resolveActor();
        LocalDateTime now = getNow();

        validateRequest(
            request.name(),
            request.scopeType(),
            request.discountType(),
            request.discountValue(),
            request.maxDiscountAmount(),
            request.fundingSource(),
            request.platformFundingRatio(),
            request.storeFundingRatio(),
            request.priority(),
            request.budget(),
            request.storeIds(),
            request.productIds()
        );

        resolveAndValidateTargets(request.scopeType(), request.storeIds(), request.productIds());

        Promotion promotion = Promotion.builder()
            .name(request.name())
            .description(request.description())
            .scopeType(request.scopeType())
            .discountType(request.discountType())
            .discountValue(request.discountValue())
            .maxDiscountAmount(request.maxDiscountAmount())
            .fundingSource(request.fundingSource())
            .platformFundingRatio(request.platformFundingRatio())
            .storeFundingRatio(request.storeFundingRatio())
            .priority(request.priority())
            .budget(request.budget())
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .releasedBudget(BigDecimal.ZERO)
            .status(PromotionStatus.DRAFT)
            .createdBy(actor)
            .createdAt(now)
            .build();

        promotion = promotionRepository.saveAndFlush(promotion);

        // Mappings
        final Integer promoId = promotion.getId();
        if (request.scopeType() == PromotionScopeType.STORE) {
            for (Integer storeId : request.storeIds()) {
                Store s = storeRepository.getReferenceById(storeId);
                PromotionStore ps = PromotionStore.builder()
                    .id(new PromotionStoreId(promoId, storeId))
                    .promotion(promotion)
                    .store(s)
                    .build();
                promotionStoreRepository.save(ps);
            }
        } else if (request.scopeType() == PromotionScopeType.PRODUCT) {
            for (Integer plantId : request.productIds()) {
                Plant p = plantRepository.getReferenceById(plantId);
                PromotionProduct pp = PromotionProduct.builder()
                    .id(new PromotionProductId(promoId, plantId))
                    .promotion(promotion)
                    .plant(p)
                    .build();
                promotionProductRepository.save(pp);
            }
        }

        PromotionAuditHistory audit = PromotionAuditHistory.builder()
            .promotion(promotion)
            .previousStatus(null)
            .newStatus(PromotionStatus.DRAFT)
            .actionType("CREATED")
            .actorUser(actor)
            .reason(null)
            .createdAt(now)
            .build();
        promotionAuditHistoryRepository.save(audit);

        promotionRepository.flush();
        promotionStoreRepository.flush();
        promotionProductRepository.flush();
        promotionAuditHistoryRepository.flush();

        return getDetailResponse(promotion);
    }

    @Transactional
    public PromotionDetailResponse updateDraft(Integer promotionId, UpdatePromotionDraftRequest request) {
        User actor = resolveActor();
        LocalDateTime now = getNow();

        Promotion promotion = promotionRepository.findAndLockById(promotionId)
            .orElseThrow(() -> new CustomException("Không tìm thấy chương trình khuyến mãi", HttpStatus.NOT_FOUND));

        if (!Objects.equals(promotion.getVersion(), request.version())) {
            throw new CustomException("Thông tin đã bị thay đổi bởi người khác", HttpStatus.CONFLICT);
        }

        if (promotion.getStatus() != PromotionStatus.DRAFT) {
            throw new CustomException("Chỉ được sửa chương trình khuyến mãi ở trạng thái DRAFT", HttpStatus.CONFLICT);
        }

        validateRequest(
            request.name(),
            request.scopeType(),
            request.discountType(),
            request.discountValue(),
            request.maxDiscountAmount(),
            request.fundingSource(),
            request.platformFundingRatio(),
            request.storeFundingRatio(),
            request.priority(),
            request.budget(),
            request.storeIds(),
            request.productIds()
        );

        resolveAndValidateTargets(request.scopeType(), request.storeIds(), request.productIds());

        promotion.setName(request.name());
        promotion.setDescription(request.description());
        promotion.setScopeType(request.scopeType());
        promotion.setDiscountType(request.discountType());
        promotion.setDiscountValue(request.discountValue());
        promotion.setMaxDiscountAmount(request.maxDiscountAmount());
        promotion.setFundingSource(request.fundingSource());
        promotion.setPlatformFundingRatio(request.platformFundingRatio());
        promotion.setStoreFundingRatio(request.storeFundingRatio());
        promotion.setPriority(request.priority());
        promotion.setBudget(request.budget());

        // Delete old mappings
        promotionStoreRepository.deleteAllByPromotionId(promotionId);
        promotionProductRepository.deleteAllByPromotionId(promotionId);
        promotionStoreRepository.flush();
        promotionProductRepository.flush();

        // Mappings
        if (request.scopeType() == PromotionScopeType.STORE) {
            for (Integer storeId : request.storeIds()) {
                Store s = storeRepository.getReferenceById(storeId);
                PromotionStore ps = PromotionStore.builder()
                    .id(new PromotionStoreId(promotionId, storeId))
                    .promotion(promotion)
                    .store(s)
                    .build();
                promotionStoreRepository.save(ps);
            }
        } else if (request.scopeType() == PromotionScopeType.PRODUCT) {
            for (Integer plantId : request.productIds()) {
                Plant p = plantRepository.getReferenceById(plantId);
                PromotionProduct pp = PromotionProduct.builder()
                    .id(new PromotionProductId(promotionId, plantId))
                    .promotion(promotion)
                    .plant(p)
                    .build();
                promotionProductRepository.save(pp);
            }
        }

        PromotionAuditHistory audit = PromotionAuditHistory.builder()
            .promotion(promotion)
            .previousStatus(PromotionStatus.DRAFT)
            .newStatus(PromotionStatus.DRAFT)
            .actionType("UPDATED_DRAFT")
            .actorUser(actor)
            .reason(null)
            .createdAt(now)
            .build();
        promotionAuditHistoryRepository.save(audit);

        promotion = promotionRepository.saveAndFlush(promotion);
        promotionStoreRepository.flush();
        promotionProductRepository.flush();
        promotionAuditHistoryRepository.flush();

        return getDetailResponse(promotion);
    }

    @Transactional
    public PromotionDetailResponse activate(Integer promotionId, PromotionActionRequest request) {
        User actor = resolveActor();
        String normalizedReason = normalizeAndValidateReason(request.reason(), true);
        LocalDateTime now = getNow();

        Promotion promotion = promotionRepository.findAndLockById(promotionId)
            .orElseThrow(() -> new CustomException("Không tìm thấy chương trình khuyến mãi", HttpStatus.NOT_FOUND));

        if (!Objects.equals(promotion.getVersion(), request.version())) {
            throw new CustomException("Thông tin đã bị thay đổi bởi người khác", HttpStatus.CONFLICT);
        }

        if (promotion.getStatus() != PromotionStatus.DRAFT) {
            throw new CustomException("Chỉ được kích hoạt chương trình khuyến mãi ở trạng thái DRAFT", HttpStatus.CONFLICT);
        }

        List<Integer> storeIds = promotionStoreRepository.findStoreIdsByPromotionId(promotionId);
        List<Integer> productIds = promotionProductRepository.findPlantIdsByPromotionId(promotionId);

        validateRequest(
            promotion.getName(),
            promotion.getScopeType(),
            promotion.getDiscountType(),
            promotion.getDiscountValue(),
            promotion.getMaxDiscountAmount(),
            promotion.getFundingSource(),
            promotion.getPlatformFundingRatio(),
            promotion.getStoreFundingRatio(),
            promotion.getPriority(),
            promotion.getBudget(),
            storeIds,
            productIds
        );

        resolveAndValidateTargets(promotion.getScopeType(), storeIds, productIds);

        BigDecimal budgetVal = promotion.getBudget() != null ? promotion.getBudget() : BigDecimal.ZERO;
        BigDecimal reservedVal = promotion.getReservedBudget() != null ? promotion.getReservedBudget() : BigDecimal.ZERO;
        BigDecimal consumedVal = promotion.getConsumedBudget() != null ? promotion.getConsumedBudget() : BigDecimal.ZERO;

        if (budgetVal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Ngân sách phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }
        BigDecimal sumConsumed = reservedVal.add(consumedVal);
        if (sumConsumed.compareTo(budgetVal) > 0) {
            throw new CustomException("Ngân sách hiện tại không hợp lệ với lượng đã đặt trước và tiêu dùng", HttpStatus.BAD_REQUEST);
        }

        promotion.setStatus(PromotionStatus.ACTIVE);
        promotion.setActivatedBy(actor);
        promotion.setActivatedAt(now);

        PromotionAuditHistory audit = PromotionAuditHistory.builder()
            .promotion(promotion)
            .previousStatus(PromotionStatus.DRAFT)
            .newStatus(PromotionStatus.ACTIVE)
            .actionType("ACTIVATED")
            .actorUser(actor)
            .reason(normalizedReason)
            .createdAt(now)
            .build();
        promotionAuditHistoryRepository.save(audit);

        promotion = promotionRepository.saveAndFlush(promotion);
        promotionAuditHistoryRepository.flush();

        return getDetailResponse(promotion);
    }

    @Transactional
    public PromotionDetailResponse end(Integer promotionId, PromotionActionRequest request) {
        User actor = resolveActor();
        String normalizedReason = normalizeAndValidateReason(request.reason(), true);
        LocalDateTime now = getNow();

        Promotion promotion = promotionRepository.findAndLockById(promotionId)
            .orElseThrow(() -> new CustomException("Không tìm thấy chương trình khuyến mãi", HttpStatus.NOT_FOUND));

        if (!Objects.equals(promotion.getVersion(), request.version())) {
            throw new CustomException("Thông tin đã bị thay đổi bởi người khác", HttpStatus.CONFLICT);
        }

        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            throw new CustomException("Chỉ được kết thúc chương trình khuyến mãi ở trạng thái ACTIVE", HttpStatus.CONFLICT);
        }

        promotion.setStatus(PromotionStatus.ENDED);
        promotion.setEndedBy(actor);
        promotion.setEndedAt(now);
        promotion.setEndReason(normalizedReason);

        PromotionAuditHistory audit = PromotionAuditHistory.builder()
            .promotion(promotion)
            .previousStatus(PromotionStatus.ACTIVE)
            .newStatus(PromotionStatus.ENDED)
            .actionType("ENDED")
            .actorUser(actor)
            .reason(normalizedReason)
            .createdAt(now)
            .build();
        promotionAuditHistoryRepository.save(audit);

        promotion = promotionRepository.saveAndFlush(promotion);
        promotionAuditHistoryRepository.flush();

        return getDetailResponse(promotion);
    }

    @Transactional
    public PromotionDetailResponse cancel(Integer promotionId, PromotionActionRequest request) {
        User actor = resolveActor();
        String normalizedReason = normalizeAndValidateReason(request.reason(), true);
        LocalDateTime now = getNow();

        Promotion promotion = promotionRepository.findAndLockById(promotionId)
            .orElseThrow(() -> new CustomException("Không tìm thấy chương trình khuyến mãi", HttpStatus.NOT_FOUND));

        if (!Objects.equals(promotion.getVersion(), request.version())) {
            throw new CustomException("Thông tin đã bị thay đổi bởi người khác", HttpStatus.CONFLICT);
        }

        if (promotion.getStatus() != PromotionStatus.DRAFT) {
            throw new CustomException("Chỉ được hủy chương trình khuyến mãi ở trạng thái DRAFT", HttpStatus.CONFLICT);
        }

        promotion.setStatus(PromotionStatus.CANCELLED);

        PromotionAuditHistory audit = PromotionAuditHistory.builder()
            .promotion(promotion)
            .previousStatus(PromotionStatus.DRAFT)
            .newStatus(PromotionStatus.CANCELLED)
            .actionType("CANCELLED")
            .actorUser(actor)
            .reason(normalizedReason)
            .createdAt(now)
            .build();
        promotionAuditHistoryRepository.save(audit);

        promotion = promotionRepository.saveAndFlush(promotion);
        promotionAuditHistoryRepository.flush();

        return getDetailResponse(promotion);
    }

    @Transactional(readOnly = true)
    public Page<PromotionSummaryResponse> list(
        PromotionStatus status,
        PromotionScopeType scopeType,
        Pageable pageable
    ) {
        Page<Promotion> page;
        if (status != null && scopeType != null) {
            page = promotionRepository.findByStatusAndScopeType(status, scopeType, pageable);
        } else if (status != null) {
            page = promotionRepository.findByStatus(status, pageable);
        } else if (scopeType != null) {
            page = promotionRepository.findByScopeType(scopeType, pageable);
        } else {
            page = promotionRepository.findAll(pageable);
        }

        return page.map(p -> {
            BigDecimal budgetVal = p.getBudget() != null ? p.getBudget() : BigDecimal.ZERO;
            BigDecimal reservedVal = p.getReservedBudget() != null ? p.getReservedBudget() : BigDecimal.ZERO;
            BigDecimal consumedVal = p.getConsumedBudget() != null ? p.getConsumedBudget() : BigDecimal.ZERO;

            if (budgetVal.compareTo(BigDecimal.ZERO) < 0 ||
                reservedVal.compareTo(BigDecimal.ZERO) < 0 ||
                consumedVal.compareTo(BigDecimal.ZERO) < 0) {
                throw new CustomException("Dữ liệu ngân sách không nhất quán (âm)", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            BigDecimal available = budgetVal.subtract(reservedVal).subtract(consumedVal);
            if (available.compareTo(BigDecimal.ZERO) < 0) {
                throw new CustomException("Dữ liệu ngân sách khả dụng không nhất quán (âm)", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return new PromotionSummaryResponse(
                p.getId(),
                p.getName(),
                p.getScopeType(),
                p.getDiscountType(),
                p.getDiscountValue(),
                p.getMaxDiscountAmount(),
                p.getFundingSource(),
                p.getPlatformFundingRatio(),
                p.getStoreFundingRatio(),
                p.getPriority(),
                budgetVal,
                reservedVal,
                consumedVal,
                available,
                p.getStatus(),
                p.getVersion(),
                p.getCreatedAt(),
                p.getActivatedAt(),
                p.getEndedAt()
            );
        });
    }

    @Transactional(readOnly = true)
    public PromotionDetailResponse getDetail(Integer promotionId) {
        Promotion p = promotionRepository.findById(promotionId)
            .orElseThrow(() -> new CustomException("Không tìm thấy chương trình khuyến mãi", HttpStatus.NOT_FOUND));
        return getDetailResponse(p);
    }

    private PromotionDetailResponse getDetailResponse(Promotion p) {
        BigDecimal budgetVal = p.getBudget() != null ? p.getBudget() : BigDecimal.ZERO;
        BigDecimal reservedVal = p.getReservedBudget() != null ? p.getReservedBudget() : BigDecimal.ZERO;
        BigDecimal consumedVal = p.getConsumedBudget() != null ? p.getConsumedBudget() : BigDecimal.ZERO;

        if (budgetVal.compareTo(BigDecimal.ZERO) < 0 ||
            reservedVal.compareTo(BigDecimal.ZERO) < 0 ||
            consumedVal.compareTo(BigDecimal.ZERO) < 0) {
            throw new CustomException("Dữ liệu ngân sách không nhất quán (âm)", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        BigDecimal available = budgetVal.subtract(reservedVal).subtract(consumedVal);
        if (available.compareTo(BigDecimal.ZERO) < 0) {
            throw new CustomException("Dữ liệu ngân sách khả dụng không nhất quán (âm)", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        List<Integer> storeIds = promotionStoreRepository.findStoreIdsByPromotionId(p.getId());
        List<Integer> productIds = promotionProductRepository.findPlantIdsByPromotionId(p.getId());
        List<PromotionAuditHistory> audits = promotionAuditHistoryRepository.findByPromotionIdOrderByCreatedAtDesc(p.getId());

        List<PromotionAuditHistoryDto> auditDtos = audits.stream()
            .map(a -> new PromotionAuditHistoryDto(
                a.getId(),
                a.getPreviousStatus(),
                a.getNewStatus(),
                a.getActionType(),
                a.getActorUser() != null ? a.getActorUser().getId() : null,
                a.getReason(),
                a.getCreatedAt()
            )).toList();

        return new PromotionDetailResponse(
            p.getId(),
            p.getName(),
            p.getScopeType(),
            p.getDiscountType(),
            p.getDiscountValue(),
            p.getMaxDiscountAmount(),
            p.getFundingSource(),
            p.getPlatformFundingRatio(),
            p.getStoreFundingRatio(),
            p.getPriority(),
            budgetVal,
            reservedVal,
            consumedVal,
            available,
            p.getStatus(),
            p.getVersion(),
            p.getCreatedAt(),
            p.getActivatedAt(),
            p.getEndedAt(),
            p.getDescription(),
            p.getReleasedBudget(),
            p.getCreatedBy() != null ? p.getCreatedBy().getId() : null,
            p.getActivatedBy() != null ? p.getActivatedBy().getId() : null,
            p.getEndedBy() != null ? p.getEndedBy().getId() : null,
            p.getEndReason(),
            storeIds,
            productIds,
            auditDtos
        );
    }
}
