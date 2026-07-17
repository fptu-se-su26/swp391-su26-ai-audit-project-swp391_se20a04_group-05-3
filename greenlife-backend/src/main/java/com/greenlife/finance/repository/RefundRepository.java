package com.greenlife.finance.repository;

import com.greenlife.finance.entity.Refund;
import com.greenlife.finance.entity.enums.RefundStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RefundRepository extends JpaRepository<Refund, Integer> {

    Optional<Refund> findByOrderId(Integer orderId);

    Optional<Refund> findByIdempotencyKey(String idempotencyKey);

    Optional<Refund> findByTransactionReference(String transactionReference);

    List<Refund> findByStatusOrderByCreatedAtAsc(RefundStatus status);

    /**
     * Pessimistically lock a refund by its ID.
     * Note: This lock is only effective inside an active transaction boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Refund r where r.id = :id")
    Optional<Refund> findAndLockById(@Param("id") Integer id);
}
