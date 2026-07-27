package com.greenlife.store.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApproveStoreRequest {
    private String reason;
}
