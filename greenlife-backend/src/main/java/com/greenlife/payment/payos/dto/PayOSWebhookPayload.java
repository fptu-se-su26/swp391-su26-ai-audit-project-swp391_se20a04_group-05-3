package com.greenlife.payment.payos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayOSWebhookPayload {
    private String code;
    private String desc;
    private Boolean success;
    private PayOSWebhookData data;
    private String signature;
}
