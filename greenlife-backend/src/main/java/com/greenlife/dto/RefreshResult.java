package com.greenlife.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshResult {
    private AuthResponse authResponse;
    private String newRawRefreshToken;
}
