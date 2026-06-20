package com.greenlife.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Integer id;
    private Integer storeId;
    private String storeName;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
    private String note;
    private LocalDateTime createdAt;
    private String paymentUrl;
    private List<OrderDetailResponse> details;
}
