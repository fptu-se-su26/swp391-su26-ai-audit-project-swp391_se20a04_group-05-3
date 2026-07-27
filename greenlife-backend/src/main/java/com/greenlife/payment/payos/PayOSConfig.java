package com.greenlife.payment.payos;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class PayOSConfig {

    @Value("${payos.client-id:}")
    private String clientId;

    @Value("${payos.api-key:}")
    private String apiKey;

    @Value("${payos.checksum-key:}")
    private String checksumKey;

    @Value("${payos.return-url:http://localhost:3000/payment/success}")
    private String returnUrl;

    @Value("${payos.cancel-url:http://localhost:3000/payment/cancel}")
    private String cancelUrl;

    @Value("${payos.webhook-url:http://localhost:8080/api/payments/payos/webhook}")
    private String webhookUrl;
}
