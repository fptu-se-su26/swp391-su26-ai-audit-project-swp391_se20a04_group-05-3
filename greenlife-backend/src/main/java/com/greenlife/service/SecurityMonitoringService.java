package com.greenlife.service;

import com.greenlife.entity.User;
import com.greenlife.entity.LoginAudit;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.repository.SecurityAuditRepository;
import com.greenlife.repository.LoginAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.greenlife.entity.enums.SuspiciousActivityType;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SecurityMonitoringService {

    private final SecurityAuditRepository securityAuditRepository;
    private final LoginAuditRepository loginAuditRepository;
    private final SecurityAuditService securityAuditService;

    public void checkFailedLogins(User user, String email) {
        if (email == null || email.isBlank()) return;
        long failedCount = loginAuditRepository.countByEmailAndSuccessAndLoginTimeAfter(email, false, LocalDateTime.now().minusMinutes(10));
        if (failedCount >= 5) {
            boolean alreadyAlerted;
            if (user != null) {
                alreadyAlerted = securityAuditRepository.existsByUserIdAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
                    user.getId(),
                    SecurityAuditAction.SUSPICIOUS_ACTIVITY,
                    SuspiciousActivityType.BRUTE_FORCE,
                    LocalDateTime.now().minusMinutes(10)
                );
            } else {
                alreadyAlerted = securityAuditRepository.existsByEmailAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
                    email,
                    SecurityAuditAction.SUSPICIOUS_ACTIVITY,
                    SuspiciousActivityType.BRUTE_FORCE,
                    LocalDateTime.now().minusMinutes(10)
                );
            }
            if (!alreadyAlerted) {
                securityAuditService.recordSecurityAudit(
                    user,
                    email,
                    SecurityAuditAction.SUSPICIOUS_ACTIVITY,
                    SuspiciousActivityType.BRUTE_FORCE,
                    "Multiple failed login attempts detected (brute force): " + failedCount + " failures in last 10 minutes"
                );
            }
        }
    }

    public void checkIpHopping(User user, String currentIp) {
        if (user == null || currentIp == null || currentIp.isBlank() || "unknown".equalsIgnoreCase(currentIp)) {
            return;
        }
        List<LoginAudit> recentSuccessful = loginAuditRepository.findByUserIdAndSuccessAndLoginTimeAfter(
            user.getId(),
            true,
            LocalDateTime.now().minusMinutes(15)
        );
        long distinctIps = recentSuccessful.stream()
            .map(LoginAudit::getIpAddress)
            .filter(ip -> ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip))
            .distinct()
            .count();

        if (distinctIps >= 2) {
            boolean alreadyAlerted = securityAuditRepository.existsByUserIdAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
                user.getId(),
                SecurityAuditAction.SUSPICIOUS_ACTIVITY,
                SuspiciousActivityType.IP_HOPPING,
                LocalDateTime.now().minusMinutes(15)
            );
            if (!alreadyAlerted) {
                securityAuditService.recordSecurityAudit(
                    user,
                    user.getEmail(),
                    SecurityAuditAction.SUSPICIOUS_ACTIVITY,
                    SuspiciousActivityType.IP_HOPPING,
                    "Multiple IP addresses detected in short period (IP hopping): " + distinctIps + " distinct IPs in last 15 minutes"
                );
            }
        }
    }

    public void handleRefreshTokenFailure(User user, String details) {
        if (user == null) return;
        boolean alreadyAlerted = securityAuditRepository.existsByUserIdAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
            user.getId(),
            SecurityAuditAction.SUSPICIOUS_ACTIVITY,
            SuspiciousActivityType.TOKEN_REPLAY,
            LocalDateTime.now().minusMinutes(15)
        );
        if (!alreadyAlerted) {
            securityAuditService.recordSecurityAudit(
                user,
                user.getEmail(),
                SecurityAuditAction.SUSPICIOUS_ACTIVITY,
                SuspiciousActivityType.TOKEN_REPLAY,
                "Suspicious refresh token activity: " + details
            );
        }
    }
}
