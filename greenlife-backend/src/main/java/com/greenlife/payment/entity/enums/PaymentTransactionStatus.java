package com.greenlife.payment.entity.enums;

public enum PaymentTransactionStatus {
    CREATED,
    PENDING,
    PAID,
    CANCELLED,
    EXPIRED,
    FAILED,
    AMOUNT_MISMATCH,
    REQUIRES_REVIEW
}
