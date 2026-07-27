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
public class PayOSPaymentLinkData {
    private Long orderCode;
    private BigDecimal amount;
    private String description;
    private String checkoutUrl;
    private String qrCode;
    private String accountNumber;
    private String accountName;
    private String payosLinkId;
    private String paymentStatus;
}
