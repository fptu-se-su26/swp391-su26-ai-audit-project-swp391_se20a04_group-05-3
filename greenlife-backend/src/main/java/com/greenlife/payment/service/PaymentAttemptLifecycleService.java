package com.greenlife.payment.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.payment.entity.enums.PaymentMethod;
import com.greenlife.payment.entity.enums.PaymentProvider;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.payment.entity.enums.PaymentTransactionStatus;
import com.greenlife.payment.repository.PaymentTransactionRepository;
import com.greenlife.payment.service.internal.PreparedPaymentAttempt;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentAttemptLifecycleService {

    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    private Long generateUniquePayosOrderCode() {
        int retries = 0;
        while (retries < 5) {
            long timestampSec = System.currentTimeMillis() / 1000;
            int randomNum = ThreadLocalRandom.current().nextInt(100, 1000);
            long candidateCode = timestampSec * 1000 + randomNum;
            
            if (orderRepository.findByPayosOrderCode(candidateCode).isEmpty()) {
                return candidateCode;
            }
            retries++;
        }
        throw new CustomException("Không thể tạo mã thanh toán duy nhất sau nhiều lần thử", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Transaction A: Prepare payment attempt lifecycle.
     * Pessimistically locks parent order, validates ownership/state, and inserts a CREATED attempt.
     */
    @Transactional
    public PreparedPaymentAttempt preparePayOSAttempt(Integer orderId, String userEmail) {
        // 1. Load and pessimistically lock parent Order
        Order order = orderRepository.findAndLockById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        // 2. Validate ownership
        if (!order.getCustomer().getEmail().equalsIgnoreCase(userEmail)) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng này", HttpStatus.FORBIDDEN);
        }

        // 3. Validate payment method is PAYOS (legacy String representation)
        if (!"PAYOS".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new CustomException("Phương thức thanh toán của đơn hàng không phải là PayOS", HttpStatus.BAD_REQUEST);
        }

        // 4. Validate total amount: must not be null and must be positive
        if (order.getTotalAmount() == null || order.getTotalAmount().signum() <= 0) {
            throw new CustomException("Giá trị đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        // 5. Reject if Order.paymentStatus is already PAID (legacy check)
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new CustomException("Đơn hàng đã được thanh toán", HttpStatus.CONFLICT);
        }

        // 6. Reject if a Phase 8 PaymentTransaction is already PAID (authoritative check)
        if (paymentTransactionRepository.existsByOrderIdAndStatus(orderId, PaymentTransactionStatus.PAID)) {
            throw new CustomException("Đơn hàng đã được thanh toán", HttpStatus.CONFLICT);
        }

        // 7. Only allow payment when order is in the awaiting-payment state (PENDING).
        //    CONFIRMED and beyond mean the order has already been accepted via another path.
        //    CANCELLED means it can never be paid.
        //    FAILED paymentStatus is allowed while order.status remains PENDING (retry scenario).
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new CustomException("Đơn hàng không ở trạng thái chờ thanh toán", HttpStatus.CONFLICT);
        }

        // 8. Check for latest PENDING attempt using deterministic order by attemptNumber DESC
        Optional<PaymentTransaction> pendingTxOpt = paymentTransactionRepository
                .findFirstByOrderIdAndStatusOrderByAttemptNumberDesc(orderId, PaymentTransactionStatus.PENDING);
        if (pendingTxOpt.isPresent()) {
            PaymentTransaction tx = pendingTxOpt.get();
            boolean amountMatches = tx.getAmount().compareTo(order.getTotalAmount()) == 0;
            boolean orderCodeMatches = order.getPayosOrderCode() != null
                    && order.getPayosOrderCode().equals(tx.getProviderOrderCode());
            boolean linkExists = order.getPayosLinkId() != null && order.getPayosCheckoutUrl() != null;

            if (amountMatches && orderCodeMatches && linkExists) {
                log.info("Reusing existing PENDING PayOS payment attempt: {} for order: {}", tx.getId(), orderId);
                return new PreparedPaymentAttempt(
                    tx.getId(),
                    orderId,
                    tx.getProviderOrderCode(),
                    tx.getAmount(),
                    tx.getAttemptNumber(),
                    true,
                    order.getPayosLinkId(),
                    order.getPayosCheckoutUrl(),
                    order.getPayosQrCode()  // QR code is nullable per existing API contract
                );
            } else {
                // A PENDING attempt exists but invariants do not match (e.g. amount drift or
                // stale projection). Do not silently create another attempt; require review.
                log.warn("PENDING PayOS attempt {} exists for order {} but invariants mismatch. amountMatches={}, orderCodeMatches={}, linkExists={}",
                        tx.getId(), orderId, amountMatches, orderCodeMatches, linkExists);
                throw new CustomException("Giao dịch thanh toán đang chờ xử lý nhưng thông tin không khớp. Vui lòng liên hệ hỗ trợ.", HttpStatus.CONFLICT);
            }
        }

        // 9. Block concurrent CREATED attempts.
        //    NOTE: Stale CREATED recovery is deferred to Stage 8B.2 status reconciliation.
        //    This prevents creation of two provider links for the same unresolved attempt.
        Optional<PaymentTransaction> createdTxOpt = paymentTransactionRepository
                .findFirstByOrderIdAndStatusOrderByAttemptNumberDesc(orderId, PaymentTransactionStatus.CREATED);
        if (createdTxOpt.isPresent()) {
            throw new CustomException("Quá trình khởi tạo thanh toán đang diễn ra, vui lòng thử lại sau.", HttpStatus.CONFLICT);
        }

        // 10. Determine next attempt number
        Integer maxAttempt = paymentTransactionRepository.findMaxAttemptNumberByOrderId(orderId);
        int nextAttempt = (maxAttempt == null ? 0 : maxAttempt) + 1;

        // 11. Generate unique provider order code and idempotency key
        String idempotencyKey = "PAYOS_ATTEMPT:" + orderId + ":" + nextAttempt;
        Long providerOrderCode = generateUniquePayosOrderCode();

        // 12. Persist new PaymentTransaction in CREATED status — snapshot amount is immutable
        PaymentTransaction tx = PaymentTransaction.builder()
                .order(order)
                .paymentMethod(PaymentMethod.PAYOS)
                .provider(PaymentProvider.PAYOS)
                .providerOrderCode(providerOrderCode)
                .amount(order.getTotalAmount())
                .attemptNumber(nextAttempt)
                .status(PaymentTransactionStatus.CREATED)
                .idempotencyKey(idempotencyKey)
                .createdAt(LocalDateTime.now())
                .build();

        PaymentTransaction savedTx = paymentTransactionRepository.save(tx);

        return new PreparedPaymentAttempt(
            savedTx.getId(),
            orderId,
            providerOrderCode,
            order.getTotalAmount(),
            nextAttempt,
            false,
            null,
            null,
            null
        );
    }


    /**
     * Transaction B: Finalize successful payment link creation by updating attempt to PENDING.
     */
    @Transactional
    public void markPayOSAttemptPending(
            Integer transactionId,
            Long providerOrderCode,
            String paymentLinkId,
            String checkoutUrl,
            String qrCode,
            String providerReference) {
        
        PaymentTransaction tx = paymentTransactionRepository.findAndLockById(transactionId)
                .orElseThrow(() -> new CustomException("Giao dịch thanh toán không tồn tại", HttpStatus.NOT_FOUND));

        if (tx.getPaymentMethod() != PaymentMethod.PAYOS) {
            throw new CustomException("Phương thức thanh toán giao dịch không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        if (!tx.getProviderOrderCode().equals(providerOrderCode)) {
            throw new CustomException("Mã tham chiếu thanh toán không khớp", HttpStatus.BAD_REQUEST);
        }

        // Idempotent bypass
        if (tx.getStatus() == PaymentTransactionStatus.PENDING && paymentLinkId.equals(tx.getPaymentLinkId())) {
            return;
        }

        if (tx.getStatus() != PaymentTransactionStatus.CREATED) {
            throw new CustomException("Trạng thái giao dịch không hợp lệ để chuyển sang PENDING: " + tx.getStatus(), HttpStatus.BAD_REQUEST);
        }

        // Update transaction attributes
        tx.setPaymentLinkId(paymentLinkId);
        tx.setProviderReference(providerReference);
        tx.setStatus(PaymentTransactionStatus.PENDING);
        paymentTransactionRepository.save(tx);

        // Sync legacy Order compatibility projection
        Order order = tx.getOrder();
        order.setPaymentProvider("PAYOS");
        order.setPayosOrderCode(providerOrderCode);
        order.setPayosLinkId(paymentLinkId);
        order.setPayosCheckoutUrl(checkoutUrl);
        order.setPayosQrCode(qrCode);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    /**
     * Finalize failed payment link creation by updating attempt to FAILED.
     */
    @Transactional
    public void markPayOSAttemptFailed(Integer transactionId, String failureCode, String failureReason) {
        PaymentTransaction tx = paymentTransactionRepository.findAndLockById(transactionId)
                .orElseThrow(() -> new CustomException("Giao dịch thanh toán không tồn tại", HttpStatus.NOT_FOUND));

        if (tx.getStatus() == PaymentTransactionStatus.PAID) {
            throw new CustomException("Không thể chuyển giao dịch đã thanh toán sang thất bại", HttpStatus.BAD_REQUEST);
        }

        if (tx.getStatus() == PaymentTransactionStatus.FAILED) {
            return; // Idempotent bypass
        }

        if (tx.getStatus() != PaymentTransactionStatus.CREATED) {
            throw new CustomException("Trạng thái giao dịch không hợp lệ để chuyển sang FAILED: " + tx.getStatus(), HttpStatus.BAD_REQUEST);
        }

        // Sanitize bounded failure data
        String sanitizedCode = (failureCode != null && failureCode.length() > 50) ? failureCode.substring(0, 50) : failureCode;
        String sanitizedReason = (failureReason != null && failureReason.length() > 500) ? failureReason.substring(0, 500) : failureReason;

        tx.setStatus(PaymentTransactionStatus.FAILED);
        tx.setFailedAt(LocalDateTime.now());
        tx.setFailureCode(sanitizedCode);
        tx.setFailureReason(sanitizedReason);
        paymentTransactionRepository.save(tx);

        // Legacy compatibility: Order remains unpaid/PENDING.
        Order order = tx.getOrder();
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }
}
