package com.greenlife.service;

import com.greenlife.dto.*;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.OrderStatus;
import com.greenlife.entity.enums.ReviewStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final PlantRepository plantRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ReviewResponse createReview(Integer customerId, ReviewRequest request) {
        if (request.getPlantId() == null && request.getStoreId() == null) {
            throw new CustomException("Sản phẩm hoặc cửa hàng được đánh giá không được để trống", HttpStatus.BAD_REQUEST);
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Plant plant = null;
        Store store = null;

        if (request.getPlantId() != null) {
            plant = plantRepository.findById(request.getPlantId())
                    .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));
            
            // Check delivered purchase
            boolean hasPurchased = orderRepository.existsByCustomerIdAndStatusAndOrderDetailsPlantId(
                    customerId, OrderStatus.DELIVERED, request.getPlantId());
            if (!hasPurchased) {
                throw new CustomException("Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng thành công", HttpStatus.BAD_REQUEST);
            }

            // Check duplicate review
            boolean hasReviewed = reviewRepository.existsByCustomerIdAndPlantId(customerId, request.getPlantId());
            if (hasReviewed) {
                throw new CustomException("Bạn đã đánh giá sản phẩm này rồi", HttpStatus.BAD_REQUEST);
            }
        } else {
            store = storeRepository.findById(request.getStoreId())
                    .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

            // Check delivered purchase
            boolean hasPurchased = orderRepository.existsByCustomerIdAndStatusAndStoreId(
                    customerId, OrderStatus.DELIVERED, request.getStoreId());
            if (!hasPurchased) {
                throw new CustomException("Bạn chỉ có thể đánh giá cửa hàng sau khi đặt mua sản phẩm thành công", HttpStatus.BAD_REQUEST);
            }

            // Check duplicate review
            boolean hasReviewed = reviewRepository.existsByCustomerIdAndStoreId(customerId, request.getStoreId());
            if (hasReviewed) {
                throw new CustomException("Bạn đã đánh giá cửa hàng này rồi", HttpStatus.BAD_REQUEST);
            }
        }

        Review review = Review.builder()
                .customer(customer)
                .plant(plant)
                .store(store)
                .rating(request.getRating())
                .comment(request.getComment())
                .status(ReviewStatus.VISIBLE)
                .createdAt(LocalDateTime.now())
                .build();

        return mapToReviewResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse updateReview(Integer customerId, Integer reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Đánh giá không tồn tại", HttpStatus.NOT_FOUND));

        // Ownership validation using immutable customer ID
        if (!review.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền chỉnh sửa đánh giá này", HttpStatus.FORBIDDEN);
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setUpdatedAt(LocalDateTime.now());

        return mapToReviewResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Integer customerId, Integer reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Đánh giá không tồn tại", HttpStatus.NOT_FOUND));

        // Ownership validation using immutable customer ID
        if (!review.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền xóa đánh giá này", HttpStatus.FORBIDDEN);
        }

        reviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getPlantReviews(Integer plantId, Pageable pageable) {
        return reviewRepository.findByPlantIdAndStatus(plantId, ReviewStatus.VISIBLE, pageable)
                .map(this::mapToReviewResponse);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getStoreReviews(Integer storeId, Pageable pageable) {
        return reviewRepository.findByStoreIdAndStatus(storeId, ReviewStatus.VISIBLE, pageable)
                .map(this::mapToReviewResponse);
    }

    @Transactional(readOnly = true)
    public RatingSummaryResponse getPlantRatingSummary(Integer plantId) {
        if (!plantRepository.existsById(plantId)) {
            throw new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND);
        }
        Double avg = reviewRepository.findAverageRatingByPlantIdAndStatus(plantId, ReviewStatus.VISIBLE)
                .orElse(0.0);
        long count = reviewRepository.countByPlantIdAndStatus(plantId, ReviewStatus.VISIBLE);
        return RatingSummaryResponse.builder()
                .averageRating(avg)
                .totalReviews(count)
                .build();
    }

    @Transactional(readOnly = true)
    public RatingSummaryResponse getStoreRatingSummary(Integer storeId) {
        if (!storeRepository.existsById(storeId)) {
            throw new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND);
        }
        Double avg = reviewRepository.findAverageRatingByStoreIdAndStatus(storeId, ReviewStatus.VISIBLE)
                .orElse(0.0);
        long count = reviewRepository.countByStoreIdAndStatus(storeId, ReviewStatus.VISIBLE);
        return RatingSummaryResponse.builder()
                .averageRating(avg)
                .totalReviews(count)
                .build();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public Page<ReviewResponse> getStoreOwnerReviews(Integer ownerId, Pageable pageable) {
        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        if (stores.isEmpty()) {
            return Page.empty(pageable);
        }
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());
        return reviewRepository.findByStoreIdInOrPlantStoreIdIn(storeIds, pageable)
                .map(this::mapToReviewResponse);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviewsForAdmin(Pageable pageable) {
        return reviewRepository.findAll(pageable)
                .map(this::mapToReviewResponse);
    }

    @Transactional
    public ReviewResponse moderateReview(Integer reviewId, String statusStr) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Đánh giá không tồn tại", HttpStatus.NOT_FOUND));

        ReviewStatus newStatus;
        try {
            newStatus = ReviewStatus.valueOf(statusStr.toUpperCase());
        } catch (Exception e) {
            throw new CustomException("Trạng thái kiểm duyệt không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        ReviewStatus oldStatus = review.getStatus();
        review.setStatus(newStatus);
        review.setUpdatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);

        if (newStatus == ReviewStatus.HIDDEN && oldStatus != ReviewStatus.HIDDEN) {
            eventPublisher.publishEvent(new com.greenlife.event.ReviewModerationEvent(
                    this,
                    saved.getId(),
                    saved.getCustomer().getId()
            ));
        }

        return mapToReviewResponse(saved);
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .customerDisplayName(review.getCustomer().getFullName())
                .plantId(review.getPlant() != null ? review.getPlant().getId() : null)
                .storeId(review.getStore() != null ? review.getStore().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus().name())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
