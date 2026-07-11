package com.greenlife.order.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequestRequest {
    private String reason; // Keep for fallback/safety
    private String reasonCode;
    private String reasonText;
    private List<String> evidenceImages;
}
