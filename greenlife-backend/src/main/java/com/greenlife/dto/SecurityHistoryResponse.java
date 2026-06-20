package com.greenlife.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityHistoryResponse {
    private LocalDateTime lastLoginAt;
    private String lastLoginIp;
    private List<LoginAuditResponse> recentSuccessfulLogins;
    private List<LoginAuditResponse> recentFailedLogins;
}
