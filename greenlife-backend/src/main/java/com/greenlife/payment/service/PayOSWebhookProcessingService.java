package com.greenlife.payment.service;

import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.event.OrderStatusEvent;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.PayOSWebhookEvent;
import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.payment.entity.enums.PaymentMethod;
import com.greenlife.payment.entity.enums.PaymentProvider;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.payment.entity.enums.PaymentTransactionStatus;
import com.greenlife.payment.entity.enums.WebhookProcessingStatus;
import com.greenlife.payment.event.PaymentEvent;
import com.greenlife.payment.payos.dto.PayOSWebhookPayload;
import com.greenlife.payment.repository.PayOSWebhookEventRepository;
import com.greenlife.payment.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.greenlife.promotion.service.PromotionReservationLifecycleService;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Processes a registered PayOS webhook event under pessimistic locks.
 * Handles both Phase 8 tracked payments (via PaymentTransaction) and
 * transitional legacy payments (via legacy Order fields, no backfill).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSWebhookProcessingService {

    private final PayOSWebhookEventRepository webhookEventRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PromotionReservationLifecycleService promotionReservationLifecycleService;


    /**
     * Processes an already-registered webhook event identified by {@code eventId}.
     * All state mutations are inside this single @Transactional boundary;
     * event and PaymentTransaction are locked pessimistically before any mutation.
     */
    @Transactional
    public void processRegisteredEvent(Long eventId, PayOSWebhookPayload payload) {
        // 1. Lock webhook event
        PayOSWebhookEvent event = webhookEventRepository.findAndLockById(eventId)
                .orElseThrow(() -> new IllegalStateException("Webhook event not found: " + eventId));

        // 2. Idempotent exit if already terminal
        WebhookProcessingStatus currentStatus = event.getProcessingStatus();
        if (currentStatus == WebhookProcessingStatus.PROCESSED || currentStatus == WebhookProcessingStatus.REJECTED) {
            log.info("Webhook event {} is already {}; returning idempotently.", eventId, currentStatus);
            return;
        }
        // RECEIVED and FAILED both proceed through the full validation path.

        Long providerOrderCode = payload.getData().getOrderCode();
        BigDecimal webhookAmount = payload.getData().getAmount();
        String webhookPaymentLinkId = payload.getData().getPaymentLinkId();
        String webhookReference = payload.getData().getReference();
        boolean isSuccess = Boolean.TRUE.equals(payload.getSuccess()) && "00".equals(payload.getData().getCode());

        // 3. Resolve Phase 8 PaymentTransaction by providerOrderCode
        Optional<PaymentTransaction> txOpt = paymentTransactionRepository
                .findAndLockByProviderOrderCode(providerOrderCode);

        if (txOpt.isPresent()) {
            // ── Phase 8 tracked payment path ──────────────────────────────────────────
            PaymentTransaction tx = txOpt.get();

            // Validate provider and method
            if (tx.getProvider() != PaymentProvider.PAYOS || tx.getPaymentMethod() != PaymentMethod.PAYOS) {
                log.warn("Webhook event {} references transaction {} with unexpected provider/method.", eventId, tx.getId());
                rejectEvent(event, "INVALID_PROVIDER", "Transaction provider or method does not match PAYOS");
                return;
            }

            if (!providerOrderCode.equals(tx.getProviderOrderCode())) {
                log.warn("Webhook event {} providerOrderCode mismatch on transaction {}.", eventId, tx.getId());
                rejectEvent(event, "ORDER_CODE_MISMATCH", "Provider order code does not match transaction record");
                return;
            }

            // Amount validation
            if (tx.getAmount().compareTo(webhookAmount) != 0) {
                log.error("PAYMENT_SECURITY_RISK: Amount mismatch on transaction {} for webhook event {}. Expected: {}, Received: [REDACTED]",
                        tx.getId(), eventId, tx.getAmount());
                if (tx.getStatus() == PaymentTransactionStatus.CREATED || tx.getStatus() == PaymentTransactionStatus.PENDING) {
                    tx.setStatus(PaymentTransactionStatus.AMOUNT_MISMATCH);
                    tx.setFailureCode("AMOUNT_MISMATCH");
                    tx.setFailureReason("Webhook amount did not match transaction snapshot");
                    tx.setFailedAt(LocalDateTime.now());
                    paymentTransactionRepository.save(tx);
                    // Leave legacy Order.paymentStatus as PENDING for manual review
                }
                rejectEvent(event, "AMOUNT_MISMATCH", "Webhook amount did not match expected value");
                return;
            }

            // Payment link ID validation (non-null, mismatched)
            if (tx.getPaymentLinkId() != null && webhookPaymentLinkId != null
                    && !tx.getPaymentLinkId().equals(webhookPaymentLinkId)) {
                log.warn("Webhook event {} payment link ID differs from transaction {} record.", eventId, tx.getId());
                rejectEvent(event, "LINK_ID_MISMATCH", "Payment link ID does not match transaction record");
                return;
            }

            // Bind providerReference and linkId if transaction fields are currently null
            if (tx.getProviderReference() == null && webhookReference != null) {
                tx.setProviderReference(webhookReference);
            }
            if (tx.getPaymentLinkId() == null && webhookPaymentLinkId != null) {
                tx.setPaymentLinkId(webhookPaymentLinkId);
            }

            Order order = tx.getOrder();

            if (isSuccess) {
                processPhase8SuccessfulPayment(tx, order, event);
            } else {
                processPhase8FailedPayment(tx, order, event);
            }

        } else {
            // ── Transitional legacy payment path (pre-cutover link paid after deployment) ──
            processLegacyWebhook(providerOrderCode, webhookAmount, webhookPaymentLinkId, webhookReference, isSuccess, event, payload);
        }
    }

    // ─── Phase 8 success transitions ────────────────────────────────────────────

    private void processPhase8SuccessfulPayment(PaymentTransaction tx, Order order, PayOSWebhookEvent event) {
        PaymentTransactionStatus status = tx.getStatus();

        if (status == PaymentTransactionStatus.PAID) {
            // A. Already PAID — idempotent; ensure legacy Order projection is consistent
            ensureLegacyOrderPaidProjection(order);
            markEventProcessed(event);
            return;
        }

        if (status == PaymentTransactionStatus.PENDING || status == PaymentTransactionStatus.CREATED) {
            // B/C. PENDING or CREATED → check for duplicate PAID attempt on same order
            boolean anotherAttemptAlreadyPaid = paymentTransactionRepository
                    .existsByOrderIdAndStatus(order.getId(), PaymentTransactionStatus.PAID);

            if (anotherAttemptAlreadyPaid) {
                log.warn("Webhook event {} SUCCESS but order {} already has a PAID attempt. Marking transaction {} REQUIRES_REVIEW.",
                        event.getId(), order.getId(), tx.getId());
                tx.setStatus(PaymentTransactionStatus.REQUIRES_REVIEW);
                paymentTransactionRepository.save(tx);
                rejectEvent(event, "DUPLICATE_PAID_ATTEMPT", "Another attempt for this order is already PAID");
                return;
            }

            // Transition to PAID
            tx.setStatus(PaymentTransactionStatus.PAID);
            tx.setPaidAt(LocalDateTime.now());
            paymentTransactionRepository.save(tx);

            // Update legacy Order compatibility projection
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Consume promotion budget reservations
            promotionReservationLifecycleService.consumeForOrder(order.getId());


            // Publish application events
            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), true));
            eventPublisher.publishEvent(new OrderStatusEvent(this, order.getId(),
                    order.getCustomer().getId(), order.getStore().getOwner().getId(), OrderStatus.CONFIRMED));

            // Future Stage 8C business reference:
            // PAYMENT_PAID:{tx.getId()} — ledger journal will be posted here.
            log.info("PaymentTransaction {} for order {} transitioned to PAID via webhook event {}.",
                    tx.getId(), order.getId(), event.getId());

            markEventProcessed(event);
            return;
        }

        if (status == PaymentTransactionStatus.FAILED || status == PaymentTransactionStatus.CANCELLED
                || status == PaymentTransactionStatus.EXPIRED) {
            // D. Terminal state — money received after local termination; do not auto-fulfill
            log.warn("Webhook event {} SUCCESS but transaction {} is in terminal state {}. Flagging REQUIRES_REVIEW.",
                    event.getId(), tx.getId(), status);
            tx.setStatus(PaymentTransactionStatus.REQUIRES_REVIEW);
            paymentTransactionRepository.save(tx);
            rejectEvent(event, "LATE_PAYMENT_TERMINAL", "Payment received after transaction reached terminal state " + status);
            return;
        }

        if (status == PaymentTransactionStatus.AMOUNT_MISMATCH || status == PaymentTransactionStatus.REQUIRES_REVIEW) {
            // E. Already flagged for review — do not mark paid
            log.warn("Webhook event {} SUCCESS but transaction {} is {}. Keeping review state.",
                    event.getId(), tx.getId(), status);
            rejectEvent(event, "ALREADY_FLAGGED", "Transaction is already in review state: " + status);
        }
    }

    private void processPhase8FailedPayment(PaymentTransaction tx, Order order, PayOSWebhookEvent event) {
        PaymentTransactionStatus status = tx.getStatus();

        if (status == PaymentTransactionStatus.PAID) {
            // Never downgrade a PAID transaction
            log.warn("Webhook event {} FAILURE but transaction {} is already PAID. Ignoring downgrade.", event.getId(), tx.getId());
            markEventProcessed(event);
            return;
        }

        if (status == PaymentTransactionStatus.CREATED || status == PaymentTransactionStatus.PENDING) {
            tx.setStatus(PaymentTransactionStatus.FAILED);
            tx.setFailedAt(LocalDateTime.now());
            tx.setFailureCode("PROVIDER_PAYMENT_FAILED");
            tx.setFailureReason("PayOS webhook reported payment failure");
            paymentTransactionRepository.save(tx);

            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            // Order.status remains PENDING — awaits customer retry or cancellation
            orderRepository.save(order);

            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), false));
            markEventProcessed(event);
            return;
        }

        // Already in terminal state — idempotent accept
        markEventProcessed(event);
    }

    // ─── Transitional legacy webhook path ───────────────────────────────────────

    @SuppressWarnings("null")
    private void processLegacyWebhook(Long providerOrderCode, BigDecimal webhookAmount,
                                      String webhookPaymentLinkId, String webhookReference,
                                      boolean isSuccess, PayOSWebhookEvent event,
                                      PayOSWebhookPayload payload) {

        // Pessimistically lock legacy Order by payosOrderCode
        Order order = orderRepository.findAndLockByPayosOrderCode(providerOrderCode).orElse(null);

        // Legacy fallback: if not found by payosOrderCode, try interpreting as GreenLife orderId
        // Only when the code safely fits Integer and the resolved order has PAYOS method.
        if (order == null && providerOrderCode <= Integer.MAX_VALUE) {
            order = orderRepository.findById(providerOrderCode.intValue()).orElse(null);
            if (order != null && (!"PAYOS".equalsIgnoreCase(order.getPaymentMethod())
                    || (order.getPayosOrderCode() != null && !order.getPayosOrderCode().equals(providerOrderCode)))) {
                // Order found but does not match legacy PAYOS provenance — reject
                order = null;
            }
        }

        if (order == null) {
            log.warn("Webhook event {} — legacy order not found for providerOrderCode: [INTERNAL:{}]",
                    event.getId(), providerOrderCode);
            rejectEvent(event, "ORDER_NOT_FOUND", "No order found for provider order code");
            return;
        }

        if (!"PAYOS".equalsIgnoreCase(order.getPaymentMethod())) {
            log.warn("Webhook event {} — legacy order {} payment method is not PAYOS.", event.getId(), order.getId());
            rejectEvent(event, "INVALID_PAYMENT_METHOD", "Order payment method is not PAYOS");
            return;
        }

        // Amount validation
        if (order.getTotalAmount().compareTo(webhookAmount) != 0) {
            log.error("PAYMENT_SECURITY_RISK: Legacy webhook amount mismatch for order: {}. Expected: {}, Received: [REDACTED]",
                    order.getId(), order.getTotalAmount());
            rejectEvent(event, "AMOUNT_MISMATCH", "Webhook amount did not match legacy order total");
            return;
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            // Already PAID — idempotent acknowledgement
            log.info("Legacy order {} already PAID. Idempotent acknowledgement for webhook event {}.", order.getId(), event.getId());
            markEventProcessed(event);
            return;
        }

        if (isSuccess) {
            log.info("LEGACY_CUTOVER_PAYMENT: Order {} confirmed PAID via legacy webhook event {}. No PaymentTransaction backfill.",
                    order.getId(), event.getId());
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Consume promotion budget reservations
            promotionReservationLifecycleService.consumeForOrder(order.getId());


            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), true));
            eventPublisher.publishEvent(new OrderStatusEvent(this, order.getId(),
                    order.getCustomer().getId(), order.getStore().getOwner().getId(), OrderStatus.CONFIRMED));

            markEventProcessed(event);
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), false));
            markEventProcessed(event);
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private void ensureLegacyOrderPaidProjection(Order order) {
        if (order.getPaymentStatus() != PaymentStatus.PAID || order.getStatus() != OrderStatus.CONFIRMED) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
        }
    }

    private void markEventProcessed(PayOSWebhookEvent event) {
        event.setProcessingStatus(WebhookProcessingStatus.PROCESSED);
        event.setProcessedAt(LocalDateTime.now());
        webhookEventRepository.save(event);
    }

    private void rejectEvent(PayOSWebhookEvent event, String code, String reason) {
        // Sanitize to column bounds
        String sanitizedCode = (code != null && code.length() > 50) ? code.substring(0, 50) : code;
        String sanitizedReason = (reason != null && reason.length() > 500) ? reason.substring(0, 500) : reason;
        event.setProcessingStatus(WebhookProcessingStatus.REJECTED);
        event.setProcessedAt(LocalDateTime.now());
        event.setFailureCode(sanitizedCode);
        event.setFailureReason(sanitizedReason);
        webhookEventRepository.save(event);
    }
}
