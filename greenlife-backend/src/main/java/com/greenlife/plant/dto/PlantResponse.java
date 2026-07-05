package com.greenlife.plant.dto;

import com.greenlife.plant.entity.enums.PlantStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlantResponse {
    private Integer id;
    private Integer storeId;
    private String storeName;
    private Integer categoryId;
    private String categoryName;
    private String categorySlug;
    private String name;
    private String slug;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private String careLevel;
    private String sunlight;
    private String waterLevel;
    private PlantStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
