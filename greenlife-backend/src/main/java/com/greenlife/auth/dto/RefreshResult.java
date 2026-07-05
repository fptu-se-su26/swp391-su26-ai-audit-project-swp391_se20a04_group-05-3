package com.greenlife.auth.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshResult {
    private AuthResponse authResponse;
    private String newRawRefreshToken;
}
