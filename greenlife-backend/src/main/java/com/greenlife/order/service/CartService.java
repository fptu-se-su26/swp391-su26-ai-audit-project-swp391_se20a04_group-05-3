package com.greenlife.order.service;

import com.greenlife.order.dto.CartItemRequest;
import com.greenlife.order.dto.CartItemResponse;
import com.greenlife.order.dto.CartItemUpdateRequest;
import com.greenlife.order.dto.CartResponse;
import com.greenlife.order.entity.CartItem;
import com.greenlife.plant.entity.Plant;
import com.greenlife.user.entity.User;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.order.repository.CartItemRepository;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.greenlife.promotion.service.PriceEngineService;
import com.greenlife.promotion.dto.PromotionPriceRequest;
import com.greenlife.promotion.dto.PromotionPriceQuote;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final PriceEngineService priceEngineService;

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public CartResponse getCart(Integer customerId) {
        List<CartItem> items = cartItemRepository.findByCustomerId(customerId);
        if (items.isEmpty()) {
            return CartResponse.builder()
                    .items(java.util.Collections.emptyList())
                    .subtotal(BigDecimal.ZERO)
                    .build();
        }

        List<PromotionPriceRequest> priceRequests = items.stream()
                .map(item -> new PromotionPriceRequest(
                        item.getPlant().getId(),
                        item.getPlant().getStore().getId(),
                        item.getQuantity(),
                        item.getPlant().getPrice()
                ))
                .collect(Collectors.toList());

        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(priceRequests);
        java.util.Map<Integer, PromotionPriceQuote> quotesByPlantId = quotes.stream()
                .collect(Collectors.toMap(PromotionPriceQuote::plantId, q -> q, (q1, q2) -> q1));

        List<CartItemResponse> itemResponses = items.stream()
                .map(item -> mapToCartItemResponseWithQuote(item, quotesByPlantId.get(item.getPlant().getId())))
                .collect(Collectors.toList());

        BigDecimal subtotal = quotes.stream()
                .map(PromotionPriceQuote::lineEffectiveAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .items(itemResponses)
                .subtotal(subtotal)
                .build();
    }

    @Transactional
    public CartItemResponse addCartItem(Integer customerId, CartItemRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Plant plant = plantRepository.findById(request.getPlantId())
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

        if (plant.getStatus() == PlantStatus.INACTIVE) {
            throw new CustomException("Sản phẩm không hoạt động", HttpStatus.BAD_REQUEST);
        }

        if (request.getQuantity() < 1) {
            throw new CustomException("Số lượng phải lớn hơn hoặc bằng 1", HttpStatus.BAD_REQUEST);
        }

        // Find if product already exists in cart for this customer
        CartItem cartItem = cartItemRepository.findByCustomerIdAndPlantId(customerId, request.getPlantId())
                .orElse(null);

        int targetQuantity = request.getQuantity();
        if (cartItem != null) {
            targetQuantity += cartItem.getQuantity();
        }

        // Stock check
        if (targetQuantity > plant.getStock()) {
            throw new CustomException("Số lượng sản phẩm vượt quá tồn kho khả dụng (" + plant.getStock() + ")", HttpStatus.BAD_REQUEST);
        }

        if (cartItem == null) {
            cartItem = CartItem.builder()
                    .customer(customer)
                    .plant(plant)
                    .quantity(targetQuantity)
                    .addedAt(LocalDateTime.now())
                    .build();
        } else {
            cartItem.setQuantity(targetQuantity);
            cartItem.setUpdatedAt(LocalDateTime.now());
        }

        CartItem saved = cartItemRepository.save(cartItem);
        List<PromotionPriceRequest> requests = List.of(new PromotionPriceRequest(
            saved.getPlant().getId(),
            saved.getPlant().getStore().getId(),
            saved.getQuantity(),
            saved.getPlant().getPrice()
        ));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(requests);
        PromotionPriceQuote quote = quotes.isEmpty() ? null : quotes.get(0);
        return mapToCartItemResponseWithQuote(saved, quote);
    }

    @Transactional
    public CartItemResponse updateCartItemQuantity(Integer customerId, Integer id, CartItemUpdateRequest request) {
        CartItem cartItem = cartItemRepository.findById(id)
                .orElseThrow(() -> new CustomException("Mục giỏ hàng không tồn tại", HttpStatus.NOT_FOUND));

        // Ownership verification
        if (!cartItem.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền chỉnh sửa mục này", HttpStatus.FORBIDDEN);
        }

        if (request.getQuantity() < 1) {
            throw new CustomException("Số lượng phải lớn hơn hoặc bằng 1", HttpStatus.BAD_REQUEST);
        }

        Plant plant = cartItem.getPlant();
        if (plant.getStatus() == PlantStatus.INACTIVE) {
            throw new CustomException("Sản phẩm không hoạt động", HttpStatus.BAD_REQUEST);
        }

        // Stock check
        if (request.getQuantity() > plant.getStock()) {
            throw new CustomException("Số lượng sản phẩm vượt quá tồn kho khả dụng (" + plant.getStock() + ")", HttpStatus.BAD_REQUEST);
        }

        cartItem.setQuantity(request.getQuantity());
        cartItem.setUpdatedAt(LocalDateTime.now());

        CartItem saved = cartItemRepository.save(cartItem);
        List<PromotionPriceRequest> requests = List.of(new PromotionPriceRequest(
            saved.getPlant().getId(),
            saved.getPlant().getStore().getId(),
            saved.getQuantity(),
            saved.getPlant().getPrice()
        ));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(requests);
        PromotionPriceQuote quote = quotes.isEmpty() ? null : quotes.get(0);
        return mapToCartItemResponseWithQuote(saved, quote);
    }

    @Transactional
    public void removeCartItem(Integer customerId, Integer id) {
        CartItem cartItem = cartItemRepository.findById(id)
                .orElseThrow(() -> new CustomException("Mục giỏ hàng không tồn tại", HttpStatus.NOT_FOUND));

        // Ownership verification
        if (!cartItem.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền chỉnh sửa mục này", HttpStatus.FORBIDDEN);
        }

        cartItemRepository.delete(cartItem);
    }

    private CartItemResponse mapToCartItemResponse(CartItem cartItem) {
        return CartItemResponse.builder()
                .id(cartItem.getId())
                .plantId(cartItem.getPlant().getId())
                .plantName(cartItem.getPlant().getName())
                .plantPrice(cartItem.getPlant().getPrice())
                .plantImageUrl(cartItem.getPlant().getImageUrl())
                .quantity(cartItem.getQuantity())
                .plantStock(cartItem.getPlant().getStock())
                .addedAt(cartItem.getAddedAt())
                .updatedAt(cartItem.getUpdatedAt())
                .build();
    }

    private CartItemResponse mapToCartItemResponseWithQuote(CartItem cartItem, PromotionPriceQuote quote) {
        CartItemResponse resp = mapToCartItemResponse(cartItem);
        if (quote != null) {
            resp.setBaseUnitPrice(quote.baseUnitPrice());
            resp.setEffectiveUnitPrice(quote.effectiveUnitPrice());
            resp.setUnitDiscount(quote.unitDiscount());
            resp.setLineBaseAmount(quote.lineBaseAmount());
            resp.setLineEffectiveAmount(quote.lineEffectiveAmount());
            resp.setLineDiscountAmount(quote.lineDiscountAmount());
            resp.setOnSale(quote.onSale());
            resp.setPromotionId(quote.promotionId());
            resp.setPromotionName(quote.promotionName());
            
            // For backward compatibility
            resp.setPlantPrice(quote.effectiveUnitPrice());
        } else {
            BigDecimal price = cartItem.getPlant().getPrice();
            BigDecimal lineAmount = price.multiply(BigDecimal.valueOf(cartItem.getQuantity())).setScale(0, java.math.RoundingMode.HALF_UP);
            BigDecimal roundedPrice = price.setScale(0, java.math.RoundingMode.HALF_UP);
            resp.setBaseUnitPrice(roundedPrice);
            resp.setEffectiveUnitPrice(roundedPrice);
            resp.setUnitDiscount(BigDecimal.ZERO);
            resp.setLineBaseAmount(lineAmount);
            resp.setLineEffectiveAmount(lineAmount);
            resp.setLineDiscountAmount(BigDecimal.ZERO);
            resp.setOnSale(false);
            
            // For backward compatibility
            resp.setPlantPrice(roundedPrice);
        }
        return resp;
    }
}
