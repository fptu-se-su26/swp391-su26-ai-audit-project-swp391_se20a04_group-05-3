package com.greenlife.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResult {
    private AuthResponse authResponse;
    private String rawRefreshToken;
}
