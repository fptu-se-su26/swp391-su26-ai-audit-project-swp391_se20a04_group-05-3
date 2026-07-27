package com.greenlife.order.dto;

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
    private String returnRejectReason;
    private String returnRequestReason;
    private String returnRequestReasonCode;
    private List<String> evidenceImages;
    private LocalDateTime createdAt;
    private String paymentUrl;
    private String paymentProvider;
    private String payosCheckoutUrl;
    private String payosQrCode;
    private Long payosOrderCode;
    private List<OrderDetailResponse> details;
}
