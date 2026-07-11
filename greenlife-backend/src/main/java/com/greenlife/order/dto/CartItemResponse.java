package com.greenlife.order.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {
    private Integer id;
    private Integer plantId;
    private String plantName;
    private BigDecimal plantPrice;
    private String plantImageUrl;
    private Integer quantity;
    private Integer plantStock;
    private LocalDateTime addedAt;
    private LocalDateTime updatedAt;
}
