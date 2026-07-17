package com.greenlife.promotion.entity;

import com.greenlife.order.entity.Order;
import com.greenlife.promotion.entity.enums.PromotionBudgetReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_budget_reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionBudgetReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "reservation_key", nullable = false, unique = true, length = 100)
    private String reservationKey;

    @Column(name = "total_discount_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal totalDiscountAmount;

    @Column(name = "platform_funded_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal platformFundedAmount;

    @Column(name = "store_funded_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal storeFundedAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PromotionBudgetReservationStatus status;

    @Column(name = "reserved_at", nullable = false)
    @Builder.Default
    private LocalDateTime reservedAt = LocalDateTime.now();

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;
}
