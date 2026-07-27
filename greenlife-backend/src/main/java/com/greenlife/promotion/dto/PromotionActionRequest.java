package com.greenlife.promotion.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record PromotionActionRequest(
    @Size(max = 250, message = "Lý do hành động không được vượt quá 250 ký tự")
    String reason,

    @NotNull(message = "Phiên bản không được để trống")
    @PositiveOrZero(message = "Phiên bản phải lớn hơn hoặc bằng 0")
    Integer version
) {}
