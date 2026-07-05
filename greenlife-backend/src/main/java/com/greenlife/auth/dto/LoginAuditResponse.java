package com.greenlife.auth.dto;

import com.greenlife.auth.entity.enums.LoginFailureReason;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAuditResponse {
    private Long id;
    private String email;
    private boolean success;
    private String ipAddress;
    private String userAgent;
    private LoginFailureReason failureReason;
    private LocalDateTime timestamp;
}
