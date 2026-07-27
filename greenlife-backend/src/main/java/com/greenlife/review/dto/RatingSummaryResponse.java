package com.greenlife.review.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingSummaryResponse {
    private Double averageRating;
    private Long totalReviews;
}
