package com.greenlife.finance.entity;

import com.greenlife.order.entity.Order;
import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.user.entity.User;
import com.greenlife.finance.entity.enums.RefundStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_transaction_id")
    private PaymentTransaction paymentTransaction;

    @Column(name = "amount_paid_to_refund", nullable = false, precision = 12, scale = 0)
    private BigDecimal amountPaidToRefund;

    @Column(name = "store_earnings_reversal_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal storeEarningsReversalAmount;

    @Column(name = "commission_reversal_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal commissionReversalAmount;

    @Column(name = "platform_promotion_reversal_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal platformPromotionReversalAmount;

    @Column(name = "store_promotion_reversal_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal storePromotionReversalAmount;

    @Column(name = "return_status_snapshot", length = 30)
    private String returnStatusSnapshot;

    @Column(name = "return_reason_code_snapshot", length = 100)
    private String returnReasonCodeSnapshot;

    @Column(name = "return_reason_snapshot", length = 500)
    private String returnReasonSnapshot;

    @Column(name = "return_reviewed_at_snapshot")
    private LocalDateTime returnReviewedAtSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RefundStatus status;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "evidence_storage_key", length = 200)
    private String evidenceStorageKey;

    @Column(name = "evidence_original_name", length = 255)
    private String evidenceOriginalName;

    @Column(name = "evidence_content_type", length = 100)
    private String evidenceContentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "processing_at")
    private LocalDateTime processingAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;
}
