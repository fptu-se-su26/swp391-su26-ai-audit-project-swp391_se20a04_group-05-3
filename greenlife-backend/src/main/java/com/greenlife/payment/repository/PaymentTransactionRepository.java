package com.greenlife.payment.repository;

import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.payment.entity.enums.PaymentTransactionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Integer> {

    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);

    Optional<PaymentTransaction> findByProviderOrderCode(Long providerOrderCode);

    Optional<PaymentTransaction> findByPaymentLinkId(String paymentLinkId);

    Optional<PaymentTransaction> findByProviderReference(String providerReference);

    List<PaymentTransaction> findByOrderIdOrderByAttemptNumberDesc(Integer orderId);

    /**
     * Returns the latest attempt (highest attemptNumber) for the given order, regardless of status.
     * Used by status-reconciliation to determine the current active/representative attempt.
     */
    Optional<PaymentTransaction> findFirstByOrderIdOrderByAttemptNumberDesc(Integer orderId);

    /**
     * Returns the latest attempt (highest attemptNumber) for the given order and status.
     * Replaces the previously unordered findFirst variant to ensure deterministic results.
     */
    Optional<PaymentTransaction> findFirstByOrderIdAndStatusOrderByAttemptNumberDesc(
            Integer orderId, PaymentTransactionStatus status);

    boolean existsByOrderIdAndStatus(Integer orderId, PaymentTransactionStatus status);

    /**
     * Pessimistically lock a transaction by its ID.
     * Note: This lock is only effective inside an active transaction boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select pt from PaymentTransaction pt where pt.id = :id")
    Optional<PaymentTransaction> findAndLockById(@Param("id") Integer id);

    /**
     * Pessimistically lock a transaction by its provider order code.
     * Note: This lock is only effective inside an active transaction boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select pt from PaymentTransaction pt where pt.providerOrderCode = :providerOrderCode")
    Optional<PaymentTransaction> findAndLockByProviderOrderCode(@Param("providerOrderCode") Long providerOrderCode);

    /**
     * Determine the current maximum attempt number for a given order.
     * Note: This read query alone does not prevent concurrent next-attempt generation;
     * parent Order locking or retry mechanisms must be handled at the service boundary.
     */
    @Query("select coalesce(max(pt.attemptNumber), 0) from PaymentTransaction pt where pt.order.id = :orderId")
    Integer findMaxAttemptNumberByOrderId(@Param("orderId") Integer orderId);
}
