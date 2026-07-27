package com.greenlife.promotion.dto;

import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PromotionDetailResponse(
    Integer id,
    String name,
    PromotionScopeType scopeType,
    PromotionDiscountType discountType,
    BigDecimal discountValue,
    BigDecimal maxDiscountAmount,
    PromotionFundingSource fundingSource,
    BigDecimal platformFundingRatio,
    BigDecimal storeFundingRatio,
    Integer priority,
    BigDecimal budget,
    BigDecimal reservedBudget,
    BigDecimal consumedBudget,
    BigDecimal availableBudget,
    PromotionStatus status,
    Integer version,
    LocalDateTime createdAt,
    LocalDateTime activatedAt,
    LocalDateTime endedAt,

    String description,
    BigDecimal releasedBudget,
    Integer createdById,
    Integer activatedById,
    Integer endedById,
    String endReason,
    List<Integer> storeIds,
    List<Integer> productIds,
    List<PromotionAuditHistoryDto> auditHistory
) {
    public PromotionDetailResponse(
        Integer id,
        String name,
        PromotionScopeType scopeType,
        PromotionDiscountType discountType,
        BigDecimal discountValue,
        BigDecimal maxDiscountAmount,
        PromotionFundingSource fundingSource,
        BigDecimal platformFundingRatio,
        BigDecimal storeFundingRatio,
        Integer priority,
        BigDecimal budget,
        BigDecimal reservedBudget,
        BigDecimal consumedBudget,
        BigDecimal availableBudget,
        PromotionStatus status,
        Integer version,
        LocalDateTime createdAt,
        LocalDateTime activatedAt,
        LocalDateTime endedAt,
        String description,
        BigDecimal releasedBudget,
        Integer createdById,
        Integer activatedById,
        Integer endedById,
        String endReason,
        List<Integer> storeIds,
        List<Integer> productIds,
        List<PromotionAuditHistoryDto> auditHistory
    ) {
        this.id = id;
        this.name = name;
        this.scopeType = scopeType;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.maxDiscountAmount = maxDiscountAmount;
        this.fundingSource = fundingSource;
        this.platformFundingRatio = platformFundingRatio;
        this.storeFundingRatio = storeFundingRatio;
        this.priority = priority;
        this.budget = budget;
        this.reservedBudget = reservedBudget;
        this.consumedBudget = consumedBudget;
        this.availableBudget = availableBudget;
        this.status = status;
        this.version = version;
        this.createdAt = createdAt;
        this.activatedAt = activatedAt;
        this.endedAt = endedAt;
        this.description = description;
        this.releasedBudget = releasedBudget;
        this.createdById = createdById;
        this.activatedById = activatedById;
        this.endedById = endedById;
        this.endReason = endReason;

        this.storeIds = storeIds == null ? List.of() : List.copyOf(storeIds);
        this.productIds = productIds == null ? List.of() : List.copyOf(productIds);
        this.auditHistory = auditHistory == null ? List.of() : List.copyOf(auditHistory);
    }
}
