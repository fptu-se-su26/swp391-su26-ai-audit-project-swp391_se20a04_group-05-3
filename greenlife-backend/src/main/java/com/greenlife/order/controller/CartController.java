package com.greenlife.order.controller;

import com.greenlife.order.dto.*;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.order.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final CurrentUserResolver currentUserResolver;









    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(cartService.getCart(user.getId()));
    }

    @PostMapping("/items")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CartItemResponse> addCartItem(
            @Valid @RequestBody CartItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(cartService.addCartItem(user.getId(), request));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CartItemResponse> updateCartItemQuantity(
            @PathVariable Integer id,
            @Valid @RequestBody CartItemUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(cartService.updateCartItemQuantity(user.getId(), id, request));
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> removeCartItem(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        cartService.removeCartItem(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
