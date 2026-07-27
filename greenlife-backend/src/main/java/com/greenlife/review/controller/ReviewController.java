package com.greenlife.review.controller;

import com.greenlife.review.dto.RatingSummaryResponse;
import com.greenlife.review.dto.ReviewRequest;
import com.greenlife.review.dto.ReviewResponse;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final CurrentUserResolver currentUserResolver;









    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(user.getId(), request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Integer id,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(reviewService.updateReview(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        reviewService.deleteReview(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/plants/{plantId}")
    public ResponseEntity<Page<ReviewResponse>> getPlantReviews(
            @PathVariable Integer plantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(reviewService.getPlantReviews(plantId, pageable));
    }

    @GetMapping("/stores/{storeId}")
    public ResponseEntity<Page<ReviewResponse>> getStoreReviews(
            @PathVariable Integer storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(reviewService.getStoreReviews(storeId, pageable));
    }

    @GetMapping("/plants/{plantId}/summary")
    public ResponseEntity<RatingSummaryResponse> getPlantRatingSummary(@PathVariable Integer plantId) {
        return ResponseEntity.ok(reviewService.getPlantRatingSummary(plantId));
    }

    @GetMapping("/stores/{storeId}/summary")
    public ResponseEntity<RatingSummaryResponse> getStoreRatingSummary(@PathVariable Integer storeId) {
        return ResponseEntity.ok(reviewService.getStoreRatingSummary(storeId));
    }
}
