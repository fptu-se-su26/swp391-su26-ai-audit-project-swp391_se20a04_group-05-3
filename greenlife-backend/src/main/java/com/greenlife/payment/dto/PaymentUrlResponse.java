package com.greenlife.payment.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUrlResponse {
    private String paymentUrl;
}
