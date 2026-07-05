package com.greenlife.order.controller;

import com.greenlife.order.dto.*;
import com.greenlife.user.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.order.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(cartService.getCart(user.getId()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartItemResponse> addCartItem(
            @Valid @RequestBody CartItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(cartService.addCartItem(user.getId(), request));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartItemResponse> updateCartItemQuantity(
            @PathVariable Integer id,
            @Valid @RequestBody CartItemUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(cartService.updateCartItemQuantity(user.getId(), id, request));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> removeCartItem(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getAuthenticatedUser(userDetails);
        cartService.removeCartItem(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
