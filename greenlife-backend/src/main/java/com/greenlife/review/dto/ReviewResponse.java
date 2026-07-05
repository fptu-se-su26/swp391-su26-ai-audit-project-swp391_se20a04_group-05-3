package com.greenlife.review.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Integer id;
    private String customerDisplayName;
    private Integer plantId;
    private Integer storeId;
    private Integer rating;
    private String comment;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
