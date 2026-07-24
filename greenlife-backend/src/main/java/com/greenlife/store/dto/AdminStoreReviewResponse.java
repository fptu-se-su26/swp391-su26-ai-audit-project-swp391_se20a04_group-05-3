package com.greenlife.store.dto;

import com.greenlife.store.entity.enums.StoreStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStoreReviewResponse {
    private Integer id;
    private Integer ownerId;
    private String ownerName;
    private String name;
    private String phone;
    private String city;
    private String district;
    private String address;
    private String description;
    private String logoUrl;
    private String verificationDocument;
    private String businessType;
    private String cccdFrontUrl;
    private String cccdBackUrl;
    private List<String> businessEvidenceUrls;
    private StoreStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
