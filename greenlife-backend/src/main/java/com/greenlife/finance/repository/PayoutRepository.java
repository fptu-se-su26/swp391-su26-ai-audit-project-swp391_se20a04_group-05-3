package com.greenlife.finance.repository;

import com.greenlife.finance.entity.Payout;
import com.greenlife.finance.entity.enums.PayoutStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PayoutRepository extends JpaRepository<Payout, Integer> {

    Optional<Payout> findByIdempotencyKey(String idempotencyKey);

    Optional<Payout> findByTransactionReference(String transactionReference);

    List<Payout> findByStoreIdOrderByCreatedAtDesc(Integer storeId);

    List<Payout> findByStatusOrderByCreatedAtAsc(PayoutStatus status);

    /**
     * Pessimistically lock a payout by its ID.
     * Note: This lock is only effective inside an active transaction boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payout p where p.id = :id")
    Optional<Payout> findAndLockById(@Param("id") Integer id);
}
