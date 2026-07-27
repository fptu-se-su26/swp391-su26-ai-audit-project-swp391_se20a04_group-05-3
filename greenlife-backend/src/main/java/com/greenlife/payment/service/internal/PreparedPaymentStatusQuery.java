package com.greenlife.payment.service.internal;

import java.math.BigDecimal;

/**
 * Immutable context produced by the transactional read phase of a PayOS status query.
 * <p>
 * Safe to pass across the transaction boundary: contains only stable IDs and primitive
 * values — no managed/lazy JPA entities, no API credentials.
 * </p>
 *
 * @param orderId              GreenLife order PK (Integer cast to int at usage sites).
 * @param paymentTransactionId Phase-8 PaymentTransaction.id; null when phase8Tracked = false.
 * @param providerOrderCode    PayOS-side order code to use in the GET call.
 * @param expectedAmount       Amount snapshot from PaymentTransaction (or Order.totalAmount for legacy).
 * @param phase8Tracked        True iff a PaymentTransaction row owns this attempt.
 * @param locallyPaid          True iff the authoritative local state is already PAID.
 * @param legacyPaymentStatus  Legacy Order.paymentStatus.name(); null when phase8Tracked = true.
 * @param legacyOrderStatus    Legacy Order.status.name(); used to reconstruct response contract.
 * @param checkoutUrl          Stored checkout URL for response reconstruction; may be null.
 * @param qrCode               Stored QR code for response reconstruction; may be null.
 */
public record PreparedPaymentStatusQuery(
        Integer orderId,
        Integer paymentTransactionId,
        Long providerOrderCode,
        BigDecimal expectedAmount,
        boolean phase8Tracked,
        boolean locallyPaid,
        String legacyPaymentStatus,
        String legacyOrderStatus,
        String checkoutUrl,
        String qrCode
) {}
