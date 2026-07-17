package com.greenlife.payment.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.event.OrderStatusEvent;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.payment.entity.enums.PaymentMethod;
import com.greenlife.payment.entity.enums.PaymentProvider;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.payment.entity.enums.PaymentTransactionStatus;
import com.greenlife.payment.event.PaymentEvent;
import com.greenlife.payment.repository.PaymentTransactionRepository;
import com.greenlife.payment.service.internal.PreparedPaymentStatusQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.greenlife.promotion.service.PromotionReservationLifecycleService;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Reconciles PayOS provider status into local PaymentTransaction (Phase 8) or legacy Order.
 * <p>
 * This bean is intentionally separate from PayOSService so that no PayOS HTTP client is injected
 * here.  The two-phase contract is:
 * <ol>
 *   <li>{@link #prepareStatusQuery} — read-only transaction, completes before any network call.</li>
 *   <li>{@link #applyProviderStatus} — write transaction, called after network call returns.</li>
 * </ol>
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSStatusReconciliationService {

    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PromotionReservationLifecycleService promotionReservationLifecycleService;


    // ─── STEP A: prepareStatusQuery ───────────────────────────────────────────

    /**
     * Read-only transaction: resolves the Order and latest PaymentTransaction for the given
     * supplied ID, validates ownership and payment method, and returns a stable context object.
     * <p>
     * The transaction MUST commit before the caller makes any PayOS network request.
     * </p>
     *
     * @param suppliedId the path parameter from the controller; interpreted as GreenLife Order.id first,
     *                   then as payosOrderCode (legacy fallback) — matching current getPayOSPaymentStatus semantics.
     * @param userEmail  authenticated user email for ownership validation.
     * @return {@link PreparedPaymentStatusQuery} — safe to use after transaction closes.
     */
    @Transactional(readOnly = true)
    public PreparedPaymentStatusQuery prepareStatusQuery(Long suppliedId, String userEmail) {

        // 1. Resolve Order — primary key lookup first, then payosOrderCode fallback (legacy)
        Order order = orderRepository.findById(suppliedId.intValue()).orElse(null);
        if (order == null) {
            order = orderRepository.findByPayosOrderCode(suppliedId).orElse(null);
        }
        if (order == null) {
            throw new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND);
        }

        // 2. Ownership validation
        if (!order.getCustomer().getEmail().equalsIgnoreCase(userEmail)) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng này", HttpStatus.FORBIDDEN);
        }

        // 3. Payment method must be PAYOS
        if (!"PAYOS".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new CustomException("Đơn hàng không sử dụng phương thức thanh toán PayOS", HttpStatus.BAD_REQUEST);
        }

        Integer orderId = order.getId();

        // 4. Check for an existing PAID attempt first (authoritative, even if a later attempt exists)
        Optional<PaymentTransaction> paidTxOpt = paymentTransactionRepository
                .findFirstByOrderIdAndStatusOrderByAttemptNumberDesc(orderId, PaymentTransactionStatus.PAID);

        if (paidTxOpt.isPresent()) {
            PaymentTransaction paidTx = paidTxOpt.get();
            log.info("Order {} already has PAID PaymentTransaction {}; returning local PAID context.", orderId, paidTx.getId());
            return new PreparedPaymentStatusQuery(
                    orderId,
                    paidTx.getId(),
                    paidTx.getProviderOrderCode(),
                    paidTx.getAmount(),
                    true,
                    true, // locallyPaid
                    null,
                    order.getStatus() != null ? order.getStatus().name() : null,
                    order.getPayosCheckoutUrl(),
                    order.getPayosQrCode()
            );
        }

        // 5. Find latest attempt regardless of status (for CREATED recovery / PENDING reconciliation)
        Optional<PaymentTransaction> latestTxOpt = paymentTransactionRepository
                .findFirstByOrderIdOrderByAttemptNumberDesc(orderId);

        if (latestTxOpt.isPresent()) {
            PaymentTransaction tx = latestTxOpt.get();

            // Validate provider and method
            if (tx.getProvider() != PaymentProvider.PAYOS || tx.getPaymentMethod() != PaymentMethod.PAYOS) {
                log.warn("Order {} latest PaymentTransaction {} has unexpected provider/method. Cannot reconcile.", orderId, tx.getId());
                throw new CustomException("Giao dịch thanh toán không hợp lệ để truy vấn trạng thái", HttpStatus.BAD_REQUEST);
            }

            if (tx.getProviderOrderCode() == null) {
                log.warn("Order {} latest PaymentTransaction {} has no provider order code.", orderId, tx.getId());
                throw new CustomException("Không tìm thấy mã PayOS để truy vấn", HttpStatus.BAD_REQUEST);
            }

            return new PreparedPaymentStatusQuery(
                    orderId,
                    tx.getId(),
                    tx.getProviderOrderCode(),
                    tx.getAmount(),
                    true,
                    false, // not locally PAID (PAID case handled above)
                    null,
                    order.getStatus() != null ? order.getStatus().name() : null,
                    order.getPayosCheckoutUrl(),
                    order.getPayosQrCode()
            );
        }

        // 6. No PaymentTransaction → legacy path
        if (order.getPayosOrderCode() == null) {
            throw new CustomException("Không tìm thấy mã PayOS để truy vấn", HttpStatus.BAD_REQUEST);
        }

        if (order.getTotalAmount() == null || order.getTotalAmount().signum() <= 0) {
            throw new CustomException("Giá trị đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        log.info("Order {} has no PaymentTransaction; using legacy payosOrderCode for status query.", orderId);
        return new PreparedPaymentStatusQuery(
                orderId,
                null, // no PaymentTransaction
                order.getPayosOrderCode(),
                order.getTotalAmount(),
                false, // legacy
                order.getPaymentStatus() == PaymentStatus.PAID,
                order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null,
                order.getStatus() != null ? order.getStatus().name() : null,
                order.getPayosCheckoutUrl(),
                order.getPayosQrCode()
        );
    }

    // ─── STEP B: applyProviderStatus (Phase 8 tracked) ────────────────────────

    /**
     * Write transaction: applies the trusted parsed provider response to the locked PaymentTransaction
     * and legacy Order.
     * <p>
     * This method must only be called after {@link #prepareStatusQuery} has committed and after the
     * PayOS GET call has returned. The provider response map is the parsed {@code data} block from
     * the PayOS status GET response (non-null, already code-validated by the caller).
     * </p>
     *
     * @param context      the stable context from prepareStatusQuery.
     * @param providerData the PayOS response {@code data} map; must not be null.
     * @return the provider status string that was applied (for caller logging/response).
     */
    @Transactional
    public String applyProviderStatus(PreparedPaymentStatusQuery context, Map<String, Object> providerData) {
        if (!context.phase8Tracked()) {
            applyLegacyProviderStatus(context, providerData);
            return extractProviderStatus(providerData);
        }

        // 1. Lock PaymentTransaction by ID
        PaymentTransaction tx = paymentTransactionRepository
                .findAndLockById(context.paymentTransactionId())
                .orElseThrow(() -> new CustomException("Giao dịch thanh toán không tồn tại", HttpStatus.NOT_FOUND));

        // 2. Resolve parent Order
        Order order = tx.getOrder();

        // 3. Revalidate ownership-independent invariants
        if (!order.getId().equals(context.orderId())) {
            log.error("PaymentTransaction {} belongs to order {} but context expected order {}.",
                    tx.getId(), order.getId(), context.orderId());
            throw new CustomException("Giao dịch thanh toán không khớp với đơn hàng", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if (tx.getProvider() != PaymentProvider.PAYOS || tx.getPaymentMethod() != PaymentMethod.PAYOS) {
            log.warn("PaymentTransaction {} has unexpected provider/method during applyProviderStatus.", tx.getId());
            throw new CustomException("Giao dịch thanh toán không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        // Provider order code cross-check (if response carries it)
        Object responseOrderCode = providerData.get("orderCode");
        if (responseOrderCode != null) {
            long responseCode = ((Number) responseOrderCode).longValue();
            if (!tx.getProviderOrderCode().equals(responseCode)) {
                log.error("Provider order code mismatch on PaymentTransaction {}. Transaction: {}, Response: [INTERNAL]",
                        tx.getId(), tx.getProviderOrderCode());
                throw new CustomException("Mã tham chiếu thanh toán không khớp", HttpStatus.BAD_REQUEST);
            }
        }

        // 4. Extract provider status
        String providerStatus = extractProviderStatus(providerData);
        if (providerStatus == null) {
            log.warn("Provider response for PaymentTransaction {} has no status field.", tx.getId());
            throw new CustomException("Không nhận được trạng thái từ cổng thanh toán", HttpStatus.BAD_GATEWAY);
        }

        // 5. Race guard: re-read current locked status
        PaymentTransactionStatus currentStatus = tx.getStatus();

        // 5a. PAID must never be downgraded
        if (currentStatus == PaymentTransactionStatus.PAID) {
            log.info("PaymentTransaction {} is already PAID; ignoring provider status '{}'. No downgrade.",
                    tx.getId(), providerStatus);
            return providerStatus; // caller uses local PAID state to build response
        }

        // 5b. Check for duplicate PAID attempt before marking PAID
        switch (providerStatus) {
            case "PAID" -> applyPhase8Paid(tx, order, context, providerData);
            case "PENDING", "PROCESSING" -> applyPhase8Pending(tx, order, providerStatus, providerData);
            case "CANCELLED" -> applyPhase8Cancelled(tx, order);
            case "EXPIRED" -> applyPhase8Expired(tx, order);
            case "FAILED" -> applyPhase8Failed(tx, order);
            default -> {
                log.warn("Unknown provider status '{}' for PaymentTransaction {}. Setting REQUIRES_REVIEW if safe.",
                        providerStatus, tx.getId());
                if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
                    tx.setStatus(PaymentTransactionStatus.REQUIRES_REVIEW);
                    tx.setFailureCode("UNKNOWN_PROVIDER_STATUS");
                    tx.setFailureReason("Provider returned unrecognized status; manual review required");
                    paymentTransactionRepository.save(tx);
                }
            }
        }

        return providerStatus;
    }

    // ─── Phase 8 status-specific transitions ──────────────────────────────────

    @SuppressWarnings("unchecked")
    private void applyPhase8Paid(PaymentTransaction tx, Order order,
                                  PreparedPaymentStatusQuery context,
                                  Map<String, Object> providerData) {
        PaymentTransactionStatus currentStatus = tx.getStatus();

        // Another attempt on this order is already PAID?
        boolean anotherAlreadyPaid = paymentTransactionRepository
                .existsByOrderIdAndStatus(order.getId(), PaymentTransactionStatus.PAID);
        if (anotherAlreadyPaid) {
            log.warn("Status query PAID but order {} already has a PAID attempt. Marking transaction {} REQUIRES_REVIEW.",
                    order.getId(), tx.getId());
            if (currentStatus != PaymentTransactionStatus.PAID) {
                tx.setStatus(PaymentTransactionStatus.REQUIRES_REVIEW);
                tx.setFailureCode("DUPLICATE_PAID_ATTEMPT");
                tx.setFailureReason("Another attempt for this order is already PAID");
                paymentTransactionRepository.save(tx);
            }
            return;
        }

        // Amount validation using available provider fields
        BigDecimal expectedAmount = context.expectedAmount();

        // Try amountPaid (proof of full payment received)
        Object amountPaidObj = providerData.get("amountPaid");
        if (amountPaidObj == null) {
            // Fall back to top-level amount field used by legacy reconciliation
            amountPaidObj = providerData.get("amount");
        }
        if (amountPaidObj == null) {
            log.error("PAYMENT_SECURITY_RISK: Provider PAID but no amountPaid/amount field for transaction {}. Refusing PAID.", tx.getId());
            if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
                tx.setStatus(PaymentTransactionStatus.REQUIRES_REVIEW);
                tx.setFailureCode("MISSING_AMOUNT_FIELD");
                tx.setFailureReason("Provider PAID but no amount field present in response");
                paymentTransactionRepository.save(tx);
            }
            return;
        }
        long amountPaid = ((Number) amountPaidObj).longValue();
        long localExpected = expectedAmount.longValue();
        if (amountPaid < localExpected) {
            log.error("PAYMENT_SECURITY_RISK: Partial payment on transaction {}. Expected: {}, Paid: [REDACTED]",
                    tx.getId(), localExpected);
            if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
                tx.setStatus(PaymentTransactionStatus.AMOUNT_MISMATCH);
                tx.setFailureCode("AMOUNT_MISMATCH");
                tx.setFailureReason("Provider amount paid does not cover required amount");
                tx.setFailedAt(LocalDateTime.now());
                paymentTransactionRepository.save(tx);
            }
            return;
        }

        // Validate expected amount field if present in provider response
        Object expectedAmountObj = providerData.get("amount");
        if (expectedAmountObj != null) {
            long providerExpected = ((Number) expectedAmountObj).longValue();
            if (providerExpected != localExpected) {
                log.error("PAYMENT_SECURITY_RISK: Provider expected amount mismatch on transaction {}. Local: {}, Provider: [REDACTED]",
                        tx.getId(), localExpected);
                if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
                    tx.setStatus(PaymentTransactionStatus.AMOUNT_MISMATCH);
                    tx.setFailureCode("AMOUNT_MISMATCH");
                    tx.setFailureReason("Provider expected amount does not match transaction snapshot");
                    tx.setFailedAt(LocalDateTime.now());
                    paymentTransactionRepository.save(tx);
                }
                return;
            }
        }

        // Transition to PAID
        if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
            tx.setStatus(PaymentTransactionStatus.PAID);
            tx.setPaidAt(LocalDateTime.now());

            // Bind trusted provider reference if currently null
            String reference = (String) providerData.get("reference");
            if (tx.getProviderReference() == null && reference != null && !reference.isBlank()) {
                tx.setProviderReference(reference);
            }
            String paymentLinkId = (String) providerData.get("paymentLinkId");
            if (tx.getPaymentLinkId() == null && paymentLinkId != null && !paymentLinkId.isBlank()) {
                tx.setPaymentLinkId(paymentLinkId);
            }

            paymentTransactionRepository.save(tx);

            // Update legacy Order compatibility projection
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Consume promotion budget reservations
            promotionReservationLifecycleService.consumeForOrder(order.getId());


            // Publish paid events exactly once (race guard: PAID transition gate above is sufficient)
            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), true));
            eventPublisher.publishEvent(new OrderStatusEvent(this, order.getId(),
                    order.getCustomer().getId(), order.getStore().getOwner().getId(), OrderStatus.CONFIRMED));

            // PAYMENT_PAID:{tx.getId()} — ledger journal deferred to Stage 8C.
            log.info("PaymentTransaction {} for order {} transitioned to PAID via status query.", tx.getId(), order.getId());
        }
    }

    private void applyPhase8Pending(PaymentTransaction tx, Order order,
                                     String providerStatus, Map<String, Object> providerData) {
        PaymentTransactionStatus currentStatus = tx.getStatus();
        // PAID remains PAID
        if (currentStatus == PaymentTransactionStatus.PAID) return;
        // PENDING stays PENDING
        if (currentStatus == PaymentTransactionStatus.PENDING) {
            // Bind trusted link/reference fields if available and currently null
            bindTrustedLinkFields(tx, providerData);
            paymentTransactionRepository.save(tx);
            return;
        }
        // CREATED → PENDING only if provider conclusively proves the payment link exists
        if (currentStatus == PaymentTransactionStatus.CREATED) {
            String paymentLinkId = (String) providerData.get("paymentLinkId");
            String checkoutUrl = (String) providerData.get("checkoutUrl");
            if (paymentLinkId != null && !paymentLinkId.isBlank()) {
                tx.setStatus(PaymentTransactionStatus.PENDING);
                bindTrustedLinkFields(tx, providerData);
                paymentTransactionRepository.save(tx);
                // Update legacy Order
                order.setPaymentStatus(PaymentStatus.PENDING);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
                log.info("PaymentTransaction {} CREATED→PENDING via status query (provider confirmed link exists).", tx.getId());
            } else {
                // Provider says PENDING/PROCESSING but no link ID — cannot safely reuse; flag for review
                log.warn("PaymentTransaction {} is CREATED and provider status is {} but no paymentLinkId available. Marking REQUIRES_REVIEW.",
                        tx.getId(), providerStatus);
                tx.setStatus(PaymentTransactionStatus.REQUIRES_REVIEW);
                tx.setFailureCode("CREATED_NO_LINK");
                tx.setFailureReason("Provider reported " + providerStatus + " but no payment link ID available for safe reuse");
                paymentTransactionRepository.save(tx);
            }
        }
        // Other statuses (terminal): PAID guarded above; terminal statuses left unchanged
    }

    private void applyPhase8Cancelled(PaymentTransaction tx, Order order) {
        PaymentTransactionStatus currentStatus = tx.getStatus();
        if (currentStatus == PaymentTransactionStatus.PAID) return; // never downgrade
        if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
            tx.setStatus(PaymentTransactionStatus.CANCELLED);
            tx.setCancelledAt(LocalDateTime.now());
            paymentTransactionRepository.save(tx);
            // Legacy paymentStatus → FAILED (no CANCELLED in PaymentStatus enum)
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            // Order.status remains PENDING so a new attempt may later be created
            orderRepository.save(order);
            log.info("PaymentTransaction {} CANCELLED by provider status query for order {}.", tx.getId(), order.getId());
        }
    }

    private void applyPhase8Expired(PaymentTransaction tx, Order order) {
        PaymentTransactionStatus currentStatus = tx.getStatus();
        if (currentStatus == PaymentTransactionStatus.PAID) return;
        if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
            tx.setStatus(PaymentTransactionStatus.EXPIRED);
            tx.setExpiredAt(LocalDateTime.now());
            paymentTransactionRepository.save(tx);
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            log.info("PaymentTransaction {} EXPIRED by provider status query for order {}.", tx.getId(), order.getId());
        }
    }

    private void applyPhase8Failed(PaymentTransaction tx, Order order) {
        PaymentTransactionStatus currentStatus = tx.getStatus();
        if (currentStatus == PaymentTransactionStatus.PAID) return;
        if (currentStatus == PaymentTransactionStatus.CREATED || currentStatus == PaymentTransactionStatus.PENDING) {
            tx.setStatus(PaymentTransactionStatus.FAILED);
            tx.setFailedAt(LocalDateTime.now());
            tx.setFailureCode("PROVIDER_PAYMENT_FAILED");
            tx.setFailureReason("Provider status query returned FAILED");
            paymentTransactionRepository.save(tx);
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            log.info("PaymentTransaction {} FAILED by provider status query for order {}.", tx.getId(), order.getId());
        }
    }

    // ─── STEP C: Legacy apply ──────────────────────────────────────────────────

    /**
     * Applies provider status to a legacy Order (no PaymentTransaction exists).
     * <p>
     * Locks Order by payosOrderCode, revalidates payment facts, maps provider status
     * to legacy Order fields. Does NOT create PaymentTransaction, ledger, or store balance.
     * </p>
     */
    @SuppressWarnings("unchecked")
    private void applyLegacyProviderStatus(PreparedPaymentStatusQuery context, Map<String, Object> providerData) {
        // Lock legacy Order by payosOrderCode
        Order order = orderRepository.findAndLockByPayosOrderCode(context.providerOrderCode())
                .orElseGet(() -> orderRepository.findAndLockById(context.orderId()).orElse(null));

        if (order == null) {
            log.warn("Legacy status apply: order {} not found under lock.", context.orderId());
            throw new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND);
        }

        // Revalidate payment method
        if (!"PAYOS".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new CustomException("Đơn hàng không sử dụng phương thức thanh toán PayOS", HttpStatus.BAD_REQUEST);
        }

        // Validate provider order code
        if (!context.providerOrderCode().equals(order.getPayosOrderCode())) {
            log.warn("Legacy status apply: providerOrderCode mismatch for order {}.", order.getId());
            throw new CustomException("Mã tham chiếu thanh toán không khớp", HttpStatus.BAD_REQUEST);
        }

        // Amount validation
        Object amountObj = providerData.get("amount");
        if (amountObj != null) {
            long remoteAmount = ((Number) amountObj).longValue();
            long localAmount = order.getTotalAmount().longValue();
            if (remoteAmount != localAmount) {
                log.error("PAYMENT_SECURITY_RISK: Legacy amount mismatch for order {}. Expected: {}, Remote: [REDACTED]",
                        order.getId(), localAmount);
                // Do not confirm order; return silently (caller uses existing response state)
                return;
            }
        }

        // Never downgrade PAID
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            log.info("Legacy order {} already PAID; no downgrade on status query.", order.getId());
            return;
        }

        String providerStatus = extractProviderStatus(providerData);
        if (providerStatus == null) return;

        switch (providerStatus) {
            case "PAID" -> {
                log.info("LEGACY_CUTOVER_PAYMENT: Order {} confirmed PAID via status query. No PaymentTransaction backfill.", order.getId());
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setStatus(OrderStatus.CONFIRMED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);

                // Consume promotion budget reservations
                promotionReservationLifecycleService.consumeForOrder(order.getId());

                eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), true));
                eventPublisher.publishEvent(new OrderStatusEvent(this, order.getId(),
                        order.getCustomer().getId(), order.getStore().getOwner().getId(), OrderStatus.CONFIRMED));
            }
            case "CANCELLED", "EXPIRED", "FAILED" -> {
                order.setPaymentStatus(PaymentStatus.FAILED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
            }
            // PENDING/PROCESSING: leave legacy PENDING as-is
            default -> log.debug("Legacy order {} provider status '{}'; no state change.", order.getId(), providerStatus);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String extractProviderStatus(Map<String, Object> providerData) {
        Object raw = providerData.get("status");
        return (raw instanceof String s) ? s : null;
    }

    private void bindTrustedLinkFields(PaymentTransaction tx, Map<String, Object> providerData) {
        String reference = (String) providerData.get("reference");
        if (tx.getProviderReference() == null && reference != null && !reference.isBlank()) {
            tx.setProviderReference(reference);
        }
        String paymentLinkId = (String) providerData.get("paymentLinkId");
        if (tx.getPaymentLinkId() == null && paymentLinkId != null && !paymentLinkId.isBlank()) {
            tx.setPaymentLinkId(paymentLinkId);
        }
    }
}
