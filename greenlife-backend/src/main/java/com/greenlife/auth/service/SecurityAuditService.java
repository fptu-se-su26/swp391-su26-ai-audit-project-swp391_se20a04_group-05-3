package com.greenlife.auth.service;

import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.SecurityAudit;
import com.greenlife.auth.entity.LoginAudit;
import com.greenlife.auth.entity.enums.SecurityAuditAction;
import com.greenlife.auth.entity.enums.LoginFailureReason;
import com.greenlife.auth.entity.enums.SuspiciousActivityType;
import com.greenlife.auth.repository.SecurityAuditRepository;
import com.greenlife.auth.repository.LoginAuditRepository;
import com.greenlife.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SecurityAuditService {

    private final SecurityAuditRepository securityAuditRepository;
    private final LoginAuditRepository loginAuditRepository;
    private final UserRepository userRepository;

    // NOTE: Sprint 12 retention hook: Add scheduled job to archive/clean up records older than 90 days.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSecurityAudit(User user, String email, SecurityAuditAction action, SuspiciousActivityType suspiciousActivityType, String details) {
        User managedUser = null;
        if (user != null && user.getId() != null) {
            managedUser = userRepository.findById(user.getId()).orElse(null);
        }
        securityAuditRepository.save(SecurityAudit.builder()
                 .user(managedUser)
                 .email(email != null ? email : (managedUser != null ? managedUser.getEmail() : null))
                 .action(action)
                 .suspiciousActivityType(suspiciousActivityType)
                 .details(details)
                 .createdAt(LocalDateTime.now())
                 .build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSecurityAudit(User user, SecurityAuditAction action, String details) {
        recordSecurityAudit(user, null, action, null, details);
    }

    // NOTE: Sprint 12 retention hook: Add scheduled job to archive/clean up records older than 90 days.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginAudit(User user, String email, boolean success, String ipAddress, String userAgent, LoginFailureReason failureReason) {
        User managedUser = null;
        if (user != null && user.getId() != null) {
            managedUser = userRepository.findById(user.getId()).orElse(null);
        }
        loginAuditRepository.save(LoginAudit.builder()
                .user(managedUser)
                .email(email)
                .success(success)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .failureReason(failureReason)
                .loginTime(LocalDateTime.now())
                .build());
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void purgeOldAuditRecords() {
        LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
        securityAuditRepository.deleteByCreatedAtBefore(ninetyDaysAgo);
        loginAuditRepository.deleteByLoginTimeBefore(ninetyDaysAgo);
    }
}
