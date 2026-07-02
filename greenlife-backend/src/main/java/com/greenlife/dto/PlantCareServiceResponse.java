package com.greenlife.dto;

import com.greenlife.entity.enums.ServiceStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlantCareServiceResponse {
    private Integer id;
    private Integer storeId;
    private String storeName;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer durationMinutes;
    private ServiceStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
