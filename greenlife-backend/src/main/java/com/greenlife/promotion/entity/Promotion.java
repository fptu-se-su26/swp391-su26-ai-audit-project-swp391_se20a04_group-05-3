package com.greenlife.promotion.entity;

import com.greenlife.user.entity.User;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 30)
    private PromotionScopeType scopeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 30)
    private PromotionDiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 0)
    private BigDecimal discountValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "funding_source", nullable = false, length = 30)
    private PromotionFundingSource fundingSource;

    @Column(name = "platform_funding_ratio", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal platformFundingRatio = BigDecimal.ZERO;

    @Column(name = "store_funding_ratio", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal storeFundingRatio = BigDecimal.ZERO;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "max_discount_amount", precision = 12, scale = 0)
    private BigDecimal maxDiscountAmount;

    @Column(name = "budget", nullable = false, precision = 12, scale = 0)
    private BigDecimal budget;

    @Column(name = "reserved_budget", nullable = false, precision = 12, scale = 0)
    @Builder.Default
    private BigDecimal reservedBudget = BigDecimal.ZERO;

    @Column(name = "consumed_budget", nullable = false, precision = 12, scale = 0)
    @Builder.Default
    private BigDecimal consumedBudget = BigDecimal.ZERO;

    @Column(name = "released_budget", nullable = false, precision = 12, scale = 0)
    @Builder.Default
    private BigDecimal releasedBudget = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.DRAFT;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activated_by")
    private User activatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ended_by")
    private User endedBy;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "end_reason", length = 250)
    private String endReason;
}
