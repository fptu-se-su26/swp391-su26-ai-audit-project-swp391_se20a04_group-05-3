package com.greenlife.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLoginAuditResponse {
    private Long id;
    private Integer userId;
    private String email;
    private boolean success;
    private String ipAddress;
    private String userAgent;
    private String failureReason;
    private LocalDateTime timestamp;
}
