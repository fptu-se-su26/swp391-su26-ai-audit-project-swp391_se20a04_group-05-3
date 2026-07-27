package com.greenlife.payment.repository;

import com.greenlife.payment.entity.PayOSWebhookEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PayOSWebhookEventRepository extends JpaRepository<PayOSWebhookEvent, Long> {

    Optional<PayOSWebhookEvent> findByPayloadHash(String payloadHash);

    Optional<PayOSWebhookEvent> findByProviderEventId(String providerEventId);

    Optional<PayOSWebhookEvent> findFirstByProviderReferenceOrderByReceivedAtDesc(String providerReference);

    boolean existsByPayloadHash(String payloadHash);

    /**
     * Effective only inside an active transaction.
     * Used to lock a webhook event before processing to prevent concurrent state mutations.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from PayOSWebhookEvent e where e.id = :id")
    Optional<PayOSWebhookEvent> findAndLockById(@Param("id") Long id);
}

