package com.greenlife.controller;

import com.greenlife.dto.RatingSummaryResponse;
import com.greenlife.dto.ReviewRequest;
import com.greenlife.dto.ReviewResponse;
import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.UserRepository;
import com.greenlife.service.ReviewService;
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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> createReview(
            @Validated @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(user.getId(), request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Integer id,
            @Validated @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(reviewService.updateReview(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getAuthenticatedUser(userDetails);
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
