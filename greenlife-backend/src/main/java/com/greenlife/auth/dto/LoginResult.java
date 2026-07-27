package com.greenlife.auth.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResult {
    private AuthResponse authResponse;
    private String rawRefreshToken;
}
