package com.greenlife.dto;

import com.greenlife.entity.enums.StoreStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreApprovalAuditResponse {
    private Integer id;
    private Integer storeId;
    private String storeName;
    private Integer adminId;
    private String adminName;
    private StoreStatus oldStatus;
    private StoreStatus newStatus;
    private String reason;
    private LocalDateTime createdAt;
}
