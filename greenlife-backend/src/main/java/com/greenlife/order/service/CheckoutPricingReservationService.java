package com.greenlife.order.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.dto.CheckoutRequest;
import com.greenlife.order.entity.*;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.repository.*;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import com.greenlife.promotion.dto.PromotionPriceRequest;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionBudgetReservation;
import com.greenlife.promotion.entity.PromotionProductId;
import com.greenlife.promotion.entity.PromotionStoreId;
import com.greenlife.promotion.entity.enums.PromotionBudgetReservationStatus;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.repository.PromotionBudgetReservationRepository;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.CustomerAddress;
import com.greenlife.user.entity.User;
import com.greenlife.user.repository.CustomerAddressRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.promotion.service.PriceEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
@Slf4j
public class CheckoutPricingReservationService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final CustomerAddressRepository addressRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionStoreRepository promotionStoreRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final PromotionBudgetReservationRepository reservationRepository;
    private final PriceEngineService priceEngineService;
    private final Clock clock;

    @Value("${greenlife.finance.default-commission-rate:0.10}")
    private String defaultCommissionRateStr;

    @Transactional
    public List<Order> executeCheckoutTransaction(Integer customerId, CheckoutRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        List<CartItem> cartItems = cartItemRepository.findByCustomerId(customerId);
        if (cartItems.isEmpty()) {
            throw new CustomException("Giỏ hàng của bạn đang trống", HttpStatus.BAD_REQUEST);
        }

        // 1. Resolve shipping address details
        String recipientName;
        String recipientPhone;
        String shippingAddress;

        if (request.getAddressId() != null) {
            CustomerAddress address = addressRepository.findById(request.getAddressId())
                    .orElseThrow(() -> new CustomException("Địa chỉ không tồn tại", HttpStatus.BAD_REQUEST));
            if (!address.getCustomer().getId().equals(customerId)) {
                throw new CustomException("Bạn không có quyền sử dụng địa chỉ này", HttpStatus.FORBIDDEN);
            }
            recipientName = address.getRecipientName();
            recipientPhone = address.getPhone();
            shippingAddress = address.getAddressLine() + ", " + address.getWard() + ", " + address.getDistrict() + ", " + address.getCity();
        } else {
            if (request.getRecipientName() == null || request.getRecipientName().isBlank() ||
                request.getRecipientPhone() == null || request.getRecipientPhone().isBlank() ||
                request.getShippingAddress() == null || request.getShippingAddress().isBlank()) {
                throw new CustomException("Vui lòng cung cấp địa chỉ nhận hàng", HttpStatus.BAD_REQUEST);
            }
            recipientName = request.getRecipientName();
            recipientPhone = request.getRecipientPhone();
            shippingAddress = request.getShippingAddress();
        }

        // 2. Build PromotionPriceRequest using ONLY server-side loaded data
        List<PromotionPriceRequest> priceRequests = new ArrayList<>();
        Map<Integer, Plant> plantMap = new HashMap<>();

        for (CartItem item : cartItems) {
            Plant plant = plantRepository.findById(item.getPlant().getId())
                    .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

            if (plant.getStatus() == PlantStatus.INACTIVE) {
                throw new CustomException("Sản phẩm " + plant.getName() + " không hoạt động", HttpStatus.BAD_REQUEST);
            }

            if (item.getQuantity() > plant.getStock()) {
                throw new CustomException("Sản phẩm " + plant.getName() + " không đủ tồn kho khả dụng", HttpStatus.BAD_REQUEST);
            }

            plantMap.put(plant.getId(), plant);

            priceRequests.add(new PromotionPriceRequest(
                    plant.getId(),
                    plant.getStore().getId(),
                    item.getQuantity(),
                    plant.getPrice()
            ));
        }

        // Calculate quotes from price engine service
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(priceRequests);

        // 3. Lock & Revalidate Promotions
        Set<Integer> selectedPromoIds = quotes.stream()
                .map(PromotionPriceQuote::promotionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Integer> sortedPromoIds = new ArrayList<>(selectedPromoIds);
        Collections.sort(sortedPromoIds);

        Map<Integer, Promotion> lockedPromotions = new HashMap<>();
        for (Integer promoId : sortedPromoIds) {
            Promotion locked = promotionRepository.findAndLockById(promoId)
                    .orElseThrow(() -> new CustomException("Khuyến mãi không tồn tại hoặc đã bị xóa.", HttpStatus.NOT_FOUND));

            if (locked.getStatus() != PromotionStatus.ACTIVE) {
                throw new CustomException("Khuyến mãi không còn hoạt động, vui lòng tải lại giỏ hàng và thử lại.", HttpStatus.CONFLICT);
            }

            BigDecimal budgetVal = locked.getBudget() != null ? locked.getBudget() : BigDecimal.ZERO;
            BigDecimal reservedVal = locked.getReservedBudget() != null ? locked.getReservedBudget() : BigDecimal.ZERO;
            BigDecimal consumedVal = locked.getConsumedBudget() != null ? locked.getConsumedBudget() : BigDecimal.ZERO;
            BigDecimal availableBudget = budgetVal.subtract(reservedVal).subtract(consumedVal);

            BigDecimal requiredForCheckout = BigDecimal.ZERO;
            for (PromotionPriceQuote q : quotes) {
                if (promoId.equals(q.promotionId())) {
                    requiredForCheckout = requiredForCheckout.add(q.lineDiscountAmount());
                }
            }

            if (requiredForCheckout.compareTo(availableBudget) > 0) {
                throw new CustomException("Khuyến mãi đã hết ngân sách khả dụng, vui lòng tải lại giỏ hàng và thử lại.", HttpStatus.CONFLICT);
            }

            // Target eligibility revalidation
            if (locked.getScopeType() == PromotionScopeType.STORE) {
                for (PromotionPriceQuote q : quotes) {
                    if (promoId.equals(q.promotionId())) {
                        boolean exists = promotionStoreRepository.existsById(
                                new PromotionStoreId(promoId, q.storeId())
                        );
                        if (!exists) {
                            throw new CustomException("Cửa hàng không còn được áp dụng khuyến mãi này, vui lòng tải lại giỏ hàng và thử lại.", HttpStatus.CONFLICT);
                        }
                    }
                }
            } else if (locked.getScopeType() == PromotionScopeType.PRODUCT) {
                for (PromotionPriceQuote q : quotes) {
                    if (promoId.equals(q.promotionId())) {
                        boolean exists = promotionProductRepository.existsById(
                                new PromotionProductId(promoId, q.plantId())
                        );
                        if (!exists) {
                            throw new CustomException("Sản phẩm không còn được áp dụng khuyến mãi này, vui lòng tải lại giỏ hàng và thử lại.", HttpStatus.CONFLICT);
                        }
                    }
                }
            }

            lockedPromotions.put(promoId, locked);
        }

        // Group cart items and their matching quotes by store
        Map<Store, List<CartItemAndQuote>> itemsByStore = new HashMap<>();
        for (CartItem item : cartItems) {
            Plant plant = plantMap.get(item.getPlant().getId());
            Store store = plant.getStore();

            PromotionPriceQuote matchedQuote = quotes.stream()
                    .filter(q -> q.plantId().equals(plant.getId()))
                    .findFirst()
                    .orElseThrow(() -> new CustomException("Không thể tìm thấy báo giá cho sản phẩm " + plant.getName(), HttpStatus.INTERNAL_SERVER_ERROR));

            itemsByStore.computeIfAbsent(store, k -> new ArrayList<>()).add(new CartItemAndQuote(item, matchedQuote));
        }

        List<Order> createdOrders = new ArrayList<>();
        String method = (request.getPaymentMethod() != null) ? request.getPaymentMethod() : "COD";

        // Resolve commission rate fallback
        BigDecimal defaultRate = BigDecimal.valueOf(0.10);
        if (defaultCommissionRateStr != null && !defaultCommissionRateStr.trim().isEmpty()) {
            try {
                defaultRate = new BigDecimal(defaultCommissionRateStr.trim());
            } catch (NumberFormatException e) {
                log.warn("Invalid greenlife.finance.default-commission-rate: '{}', fallback to 0.10", defaultCommissionRateStr);
            }
        }

        for (Map.Entry<Store, List<CartItemAndQuote>> entry : itemsByStore.entrySet()) {
            Store store = entry.getKey();
            List<CartItemAndQuote> storeItems = entry.getValue();

            BigDecimal resolvedCommissionRate = store.getCommissionRate() != null ? store.getCommissionRate() : defaultRate;
            if (resolvedCommissionRate.compareTo(BigDecimal.ZERO) < 0 || resolvedCommissionRate.compareTo(BigDecimal.ONE) > 0) {
                throw new CustomException("Tỷ lệ hoa hồng không hợp lệ (phải từ 0 đến 1)", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            Order order = Order.builder()
                    .customer(customer)
                    .store(store)
                    .recipientName(recipientName)
                    .recipientPhone(recipientPhone)
                    .shippingAddress(shippingAddress)
                    .note(request.getNote())
                    .paymentMethod(method)
                    .paymentStatus(PaymentStatus.PENDING)
                    .status(OrderStatus.PENDING)
                    .createdAt(LocalDateTime.now(clock))
                    .shippingFee(BigDecimal.ZERO)
                    .build();

            List<OrderDetail> details = new ArrayList<>();
            BigDecimal totalFinalPaid = BigDecimal.ZERO;

            for (CartItemAndQuote pair : storeItems) {
                CartItem item = pair.item();
                PromotionPriceQuote quote = pair.quote();
                Plant plant = plantMap.get(item.getPlant().getId());

                // Deduct stock
                plant.setStock(plant.getStock() - item.getQuantity());
                plantRepository.save(plant);

                BigDecimal baseUnitPrice = plant.getPrice().setScale(0, RoundingMode.HALF_UP);
                BigDecimal storeFundedDiscount = quote.storeFundedUnitDiscount().setScale(0, RoundingMode.HALF_UP);
                BigDecimal platformFundedDiscount = quote.platformFundedUnitDiscount().setScale(0, RoundingMode.HALF_UP);
                BigDecimal finalCustomerPrice = quote.effectiveUnitPrice().setScale(0, RoundingMode.HALF_UP);

                // Validation of invariants
                if (finalCustomerPrice.compareTo(BigDecimal.ZERO) < 0) {
                    throw new CustomException("Giá khách hàng trả không được âm", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (finalCustomerPrice.compareTo(baseUnitPrice) > 0) {
                    throw new CustomException("Giá khách hàng trả không được lớn hơn giá gốc", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (storeFundedDiscount.compareTo(BigDecimal.ZERO) < 0) {
                    throw new CustomException("Chiết khấu của cửa hàng không được âm", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (platformFundedDiscount.compareTo(BigDecimal.ZERO) < 0) {
                    throw new CustomException("Chiết khấu của nền tảng không được âm", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (finalCustomerPrice.add(storeFundedDiscount).add(platformFundedDiscount).compareTo(baseUnitPrice) != 0) {
                    throw new CustomException("Tổng giá và chiết khấu phải bằng giá bán gốc", HttpStatus.INTERNAL_SERVER_ERROR);
                }

                // Line calculations
                BigDecimal lineBaseAmount = baseUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(0, RoundingMode.HALF_UP);
                BigDecimal lineStoreDiscount = storeFundedDiscount.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(0, RoundingMode.HALF_UP);
                BigDecimal linePlatformDiscount = platformFundedDiscount.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(0, RoundingMode.HALF_UP);
                BigDecimal lineCustomerPaid = finalCustomerPrice.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(0, RoundingMode.HALF_UP);

                // Commission Snapshot
                BigDecimal commissionBase = lineBaseAmount.subtract(lineStoreDiscount).setScale(0, RoundingMode.HALF_UP);
                BigDecimal commissionAmount = commissionBase.multiply(resolvedCommissionRate).setScale(0, RoundingMode.HALF_UP);
                BigDecimal storeNetAmount = commissionBase.subtract(commissionAmount).setScale(0, RoundingMode.HALF_UP);

                // Commission invariants
                if (commissionBase.compareTo(BigDecimal.ZERO) < 0) {
                    throw new CustomException("Cơ sở tính hoa hồng không được âm", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (commissionAmount.compareTo(BigDecimal.ZERO) < 0) {
                    throw new CustomException("Tiền hoa hồng không được âm", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (commissionAmount.compareTo(commissionBase) > 0) {
                    throw new CustomException("Tiền hoa hồng không được vượt quá cơ sở tính", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (storeNetAmount.compareTo(BigDecimal.ZERO) < 0) {
                    throw new CustomException("Doanh thu thực của cửa hàng không được âm", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                if (commissionAmount.add(storeNetAmount).compareTo(commissionBase) != 0) {
                    throw new CustomException("Tổng hoa hồng và thực nhận phải bằng cơ sở tính hoa hồng", HttpStatus.INTERNAL_SERVER_ERROR);
                }

                Promotion promo = quote.promotionId() != null ? lockedPromotions.get(quote.promotionId()) : null;

                OrderDetail detail = OrderDetail.builder()
                        .order(order)
                        .plant(plant)
                        .productName(plant.getName())
                        .quantity(item.getQuantity())
                        .unitPrice(finalCustomerPrice) // compatibility payable unit price
                        .lineTotal(lineCustomerPaid) // compatibility line total
                        .baseUnitPrice(baseUnitPrice)
                        .storeFundedDiscount(storeFundedDiscount)
                        .platformFundedDiscount(platformFundedDiscount)
                        .finalCustomerPrice(finalCustomerPrice)
                        .promotion(promo)
                        .promotionFundingSource(quote.promotionFundingSource())
                        .commissionRate(resolvedCommissionRate)
                        .commissionBase(commissionBase)
                        .commissionAmount(commissionAmount)
                        .storeNetAmount(storeNetAmount)
                        .build();

                details.add(detail);
                totalFinalPaid = totalFinalPaid.add(lineCustomerPaid);
            }

            order.setSubtotal(totalFinalPaid);
            order.setTotalAmount(totalFinalPaid);
            order.setOrderDetails(details);

            Order savedOrder = orderRepository.save(order);

            // 4. Budget reservation creation for promotions used in this order
            Map<Integer, List<OrderDetail>> detailsByPromo = details.stream()
                    .filter(d -> d.getPromotion() != null)
                    .collect(Collectors.groupingBy(d -> d.getPromotion().getId()));

            for (Map.Entry<Integer, List<OrderDetail>> promoEntry : detailsByPromo.entrySet()) {
                Integer promoId = promoEntry.getKey();
                List<OrderDetail> promoDetails = promoEntry.getValue();
                Promotion lockedPromo = lockedPromotions.get(promoId);

                BigDecimal totalDiscountAmount = BigDecimal.ZERO;
                BigDecimal totalPlatformAmount = BigDecimal.ZERO;
                BigDecimal totalStoreAmount = BigDecimal.ZERO;

                for (OrderDetail d : promoDetails) {
                    BigDecimal qty = BigDecimal.valueOf(d.getQuantity());
                    totalDiscountAmount = totalDiscountAmount.add(d.getStoreFundedDiscount().add(d.getPlatformFundedDiscount()).multiply(qty));
                    totalPlatformAmount = totalPlatformAmount.add(d.getPlatformFundedDiscount().multiply(qty));
                    totalStoreAmount = totalStoreAmount.add(d.getStoreFundedDiscount().multiply(qty));
                }

                totalDiscountAmount = totalDiscountAmount.setScale(0, RoundingMode.HALF_UP);
                totalPlatformAmount = totalPlatformAmount.setScale(0, RoundingMode.HALF_UP);
                totalStoreAmount = totalStoreAmount.setScale(0, RoundingMode.HALF_UP);

                String reservationKey = "PROMOTION:" + promoId + ":ORDER:" + savedOrder.getId();

                PromotionBudgetReservation reservation = PromotionBudgetReservation.builder()
                        .promotion(lockedPromo)
                        .order(savedOrder)
                        .reservationKey(reservationKey)
                        .totalDiscountAmount(totalDiscountAmount)
                        .platformFundedAmount(totalPlatformAmount)
                        .storeFundedAmount(totalStoreAmount)
                        .status(PromotionBudgetReservationStatus.RESERVED)
                        .reservedAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC))
                        .build();

                reservationRepository.save(reservation);

                // Increment locked promotion's reservedBudget
                BigDecimal currentReserved = lockedPromo.getReservedBudget() != null ? lockedPromo.getReservedBudget() : BigDecimal.ZERO;
                lockedPromo.setReservedBudget(currentReserved.add(totalDiscountAmount));
                promotionRepository.save(lockedPromo);
            }

            createdOrders.add(savedOrder);
        }

        // Clear cart
        cartItemRepository.deleteAll(cartItems);

        return createdOrders;
    }

    private record CartItemAndQuote(CartItem item, PromotionPriceQuote quote) {}
}
