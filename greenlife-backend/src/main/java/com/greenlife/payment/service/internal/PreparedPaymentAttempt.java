package com.greenlife.payment.service.internal;

import java.math.BigDecimal;

public record PreparedPaymentAttempt(
    Integer transactionId,
    Integer orderId,
    Long providerOrderCode,
    BigDecimal amount,
    Integer attemptNumber,
    boolean reuseExistingLink,
    String existingPaymentLinkId,
    String existingCheckoutUrl,
    String existingQrCode
) {}
