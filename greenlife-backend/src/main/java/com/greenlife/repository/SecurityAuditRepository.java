package com.greenlife.repository;

import com.greenlife.entity.SecurityAudit;
import com.greenlife.entity.enums.SecurityAuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

import com.greenlife.entity.enums.SuspiciousActivityType;

public interface SecurityAuditRepository extends JpaRepository<SecurityAudit, Long> {
    
    boolean existsByEmailAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
            String email, SecurityAuditAction action, SuspiciousActivityType suspiciousActivityType, LocalDateTime createdAt);

    boolean existsByUserIdAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
            Integer userId, SecurityAuditAction action, SuspiciousActivityType suspiciousActivityType, LocalDateTime createdAt);
}
