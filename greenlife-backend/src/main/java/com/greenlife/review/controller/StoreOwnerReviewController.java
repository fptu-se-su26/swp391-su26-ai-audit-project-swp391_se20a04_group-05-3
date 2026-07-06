package com.greenlife.review.controller;

import com.greenlife.review.dto.ReviewResponse;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/store-owner/reviews")
@RequiredArgsConstructor
public class StoreOwnerReviewController {

    private final ReviewService reviewService;
    private final CurrentUserResolver currentUserResolver;









    @GetMapping
    @PreAuthorize("hasRole('STORE_OWNER')")
    public ResponseEntity<Page<ReviewResponse>> getStoreOwnerReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(reviewService.getStoreOwnerReviews(user.getId(), pageable));
    }
}
