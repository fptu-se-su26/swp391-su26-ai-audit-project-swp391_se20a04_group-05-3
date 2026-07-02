package com.greenlife.service;

import com.greenlife.dto.CartItemRequest;
import com.greenlife.dto.CartItemResponse;
import com.greenlife.dto.CartItemUpdateRequest;
import com.greenlife.dto.CartResponse;
import com.greenlife.entity.CartItem;
import com.greenlife.entity.Plant;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.PlantStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.CartItemRepository;
import com.greenlife.repository.PlantRepository;
import com.greenlife.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public CartResponse getCart(Integer customerId) {
        List<CartItem> items = cartItemRepository.findByCustomerId(customerId);
        
        List<CartItemResponse> itemResponses = items.stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());

        BigDecimal subtotal = items.stream()
                .map(item -> item.getPlant().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
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
        return mapToCartItemResponse(saved);
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
        return mapToCartItemResponse(saved);
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
                .addedAt(cartItem.getAddedAt())
                .updatedAt(cartItem.getUpdatedAt())
                .build();
    }
}
