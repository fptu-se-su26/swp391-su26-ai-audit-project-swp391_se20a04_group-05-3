package com.greenlife.blog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationDecisionRequest {
    private String note;

    @NotNull(message = "Version không được để trống")
    private Integer version;
}
