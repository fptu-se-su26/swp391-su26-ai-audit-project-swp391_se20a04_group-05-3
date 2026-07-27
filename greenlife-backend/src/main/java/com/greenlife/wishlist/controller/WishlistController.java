package com.greenlife.wishlist.controller;

import com.greenlife.wishlist.dto.WishlistCheckResponse;
import com.greenlife.wishlist.dto.WishlistResponse;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final CurrentUserResolver currentUserResolver;









    @PostMapping("/{plantId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<WishlistResponse> addToWishlist(
            @PathVariable Integer plantId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        WishlistResponse response = wishlistService.addToWishlist(user.getId(), plantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{plantId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable Integer plantId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        wishlistService.removeFromWishlist(user.getId(), plantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<WishlistResponse>> getWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(wishlistService.getWishlist(user.getId(), pageable));
    }

    @GetMapping("/check/{plantId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<WishlistCheckResponse> isFavorited(
            @PathVariable Integer plantId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(wishlistService.isFavorited(user.getId(), plantId));
    }
}
