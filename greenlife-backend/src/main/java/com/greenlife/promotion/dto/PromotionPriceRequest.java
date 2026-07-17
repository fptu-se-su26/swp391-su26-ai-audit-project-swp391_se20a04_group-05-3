package com.greenlife.promotion.dto;

import java.math.BigDecimal;

public record PromotionPriceRequest(
    Integer plantId,
    Integer storeId,
    Integer quantity,
    BigDecimal baseUnitPrice
) {}
