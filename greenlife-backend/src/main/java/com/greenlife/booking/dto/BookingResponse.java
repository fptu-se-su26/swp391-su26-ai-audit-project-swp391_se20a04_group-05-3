package com.greenlife.booking.dto;

import com.greenlife.booking.entity.enums.BookingStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Integer id;
    private Integer customerId;
    private String customerName;
    private Integer storeId;
    private String storeNameSnapshot;
    private Integer serviceId;
    private String serviceNameSnapshot;
    private BigDecimal servicePriceSnapshot;
    private LocalDateTime scheduledAt;
    private String serviceAddress;
    private String customerNote;
    private BookingStatus status;
    private String cancelReason;
    private LocalDateTime confirmedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;
}
