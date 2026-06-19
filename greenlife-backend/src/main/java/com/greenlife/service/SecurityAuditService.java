package com.greenlife.service;

import com.greenlife.entity.User;
import com.greenlife.entity.SecurityAudit;
import com.greenlife.entity.LoginAudit;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.entity.enums.LoginFailureReason;
import com.greenlife.repository.SecurityAuditRepository;
import com.greenlife.repository.LoginAuditRepository;
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

    // TODO: Sprint 12 retention hook: Add scheduled job to archive/clean up records older than 90 days.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSecurityAudit(User user, String email, SecurityAuditAction action, com.greenlife.entity.enums.SuspiciousActivityType suspiciousActivityType, String details) {
        securityAuditRepository.save(SecurityAudit.builder()
                .user(user)
                .email(email != null ? email : (user != null ? user.getEmail() : null))
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

    // TODO: Sprint 12 retention hook: Add scheduled job to archive/clean up records older than 90 days.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginAudit(User user, String email, boolean success, String ipAddress, String userAgent, LoginFailureReason failureReason) {
        loginAuditRepository.save(LoginAudit.builder()
                .user(user)
                .email(email)
                .success(success)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .failureReason(failureReason)
                .loginTime(LocalDateTime.now())
                .build());
    }
}
