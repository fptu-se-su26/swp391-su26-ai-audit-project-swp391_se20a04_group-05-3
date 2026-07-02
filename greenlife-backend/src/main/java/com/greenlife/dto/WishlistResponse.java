package com.greenlife.dto;

import com.greenlife.entity.enums.PlantStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistResponse {
    private Integer id;
    private Integer plantId;
    private String plantName;
    private BigDecimal plantPrice;
    private String plantImage;
    private PlantStatus plantStatus;
    private LocalDateTime addedAt;
}
