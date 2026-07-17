package com.greenlife.promotion.dto;

import com.greenlife.promotion.entity.enums.PromotionStatus;
import java.time.LocalDateTime;

public record PromotionAuditHistoryDto(
    Integer id,
    PromotionStatus previousStatus,
    PromotionStatus newStatus,
    String actionType,
    Integer actorUserId,
    String reason,
    LocalDateTime createdAt
) {}
