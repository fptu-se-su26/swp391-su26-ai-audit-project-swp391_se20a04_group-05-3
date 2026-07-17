package com.greenlife.payment.entity;

import com.greenlife.payment.entity.enums.WebhookProcessingStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payos_webhook_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOSWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_event_id", length = 150)
    private String providerEventId;

    @Column(name = "payload_hash", nullable = false, unique = true, length = 64)
    private String payloadHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_transaction_id")
    private PaymentTransaction paymentTransaction;

    @Column(name = "provider_order_code")
    private Long providerOrderCode;

    @Column(name = "payment_link_id", length = 100)
    private String paymentLinkId;

    @Column(name = "provider_reference", length = 150)
    private String providerReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 30)
    private WebhookProcessingStatus processingStatus;

    @Column(name = "received_at", nullable = false)
    @Builder.Default
    private LocalDateTime receivedAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "failure_code", length = 50)
    private String failureCode;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;
}
