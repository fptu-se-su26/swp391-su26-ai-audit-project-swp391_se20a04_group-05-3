package com.greenlife.payment.payos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOSStatusResponse {
    private Long orderCode;
    private String paymentStatus;
    private String orderStatus;
    private BigDecimal amount;
    private String description;
    private String checkoutUrl;
    private String qrCode;
}
