package com.greenlife.payment.service;

import com.greenlife.payment.entity.PayOSWebhookEvent;
import com.greenlife.payment.entity.enums.WebhookProcessingStatus;
import com.greenlife.payment.repository.PayOSWebhookEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Handles durable registration of a single PayOS webhook delivery.
 * Uses REQUIRES_NEW so the INSERT+flush commits independently of the caller's transaction,
 * allowing DataIntegrityViolationException to surface from the unique payloadHash constraint
 * before the caller decides how to handle a duplicate delivery.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSWebhookRegistrationService {

    private final PayOSWebhookEventRepository webhookEventRepository;

    /**
     * Insert a new webhook event record and flush so the unique-constraint violation
     * is raised inside this independent transaction, not inside the caller's outer scope.
     *
     * @return ID of the newly persisted event.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long registerNewEvent(
            String payloadHash,
            String providerEventId,
            Long providerOrderCode,
            String paymentLinkId,
            String providerReference) {

        PayOSWebhookEvent event = PayOSWebhookEvent.builder()
                .payloadHash(payloadHash)
                .providerEventId(providerEventId)
                .providerOrderCode(providerOrderCode)
                .paymentLinkId(paymentLinkId)
                .providerReference(providerReference)
                .processingStatus(WebhookProcessingStatus.RECEIVED)
                .receivedAt(LocalDateTime.now())
                .build();

        // saveAndFlush causes the DB unique constraint to fire inside this transaction boundary.
        PayOSWebhookEvent saved = webhookEventRepository.saveAndFlush(event);
        return saved.getId();
    }

    /**
     * Read-only lookup of an existing event by payload hash.
     * Called after a DataIntegrityViolationException to find the first registrant.
     */
    @Transactional(readOnly = true)
    public Optional<PayOSWebhookEvent> findExistingByPayloadHash(String payloadHash) {
        return webhookEventRepository.findByPayloadHash(payloadHash);
    }
}
