package com.greenlife.order.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRejectRequest {
    private String reason;
}
