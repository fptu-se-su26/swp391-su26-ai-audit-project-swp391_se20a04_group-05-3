package com.greenlife.promotion.dto;

import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionSummaryResponse(
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
    LocalDateTime endedAt
) {}
