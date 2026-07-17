package com.greenlife.promotion.dto;

import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionPriceQuote(
    Integer plantId,
    Integer storeId,
    Integer quantity,
    BigDecimal baseUnitPrice,
    BigDecimal effectiveUnitPrice,
    BigDecimal unitDiscount,
    BigDecimal lineBaseAmount,
    BigDecimal lineEffectiveAmount,
    BigDecimal lineDiscountAmount,
    BigDecimal storeFundedUnitDiscount,
    BigDecimal platformFundedUnitDiscount,
    BigDecimal storeFundedLineDiscount,
    BigDecimal platformFundedLineDiscount,
    Boolean onSale,
    Integer promotionId,
    String promotionName,
    PromotionFundingSource promotionFundingSource,
    LocalDateTime quotedAt
) {}
