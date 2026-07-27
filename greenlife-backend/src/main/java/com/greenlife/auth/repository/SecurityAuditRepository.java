package com.greenlife.auth.repository;

import com.greenlife.auth.entity.SecurityAudit;
import com.greenlife.auth.entity.enums.SecurityAuditAction;
import com.greenlife.auth.entity.enums.SuspiciousActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface SecurityAuditRepository extends JpaRepository<SecurityAudit, Long> {
    
    boolean existsByEmailAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
            String email, SecurityAuditAction action, SuspiciousActivityType suspiciousActivityType, LocalDateTime createdAt);

    boolean existsByUserIdAndActionAndSuspiciousActivityTypeAndCreatedAtAfter(
            Integer userId, SecurityAuditAction action, SuspiciousActivityType suspiciousActivityType, LocalDateTime createdAt);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM SecurityAudit s WHERE s.createdAt < :date")
    void deleteByCreatedAtBefore(@org.springframework.data.repository.query.Param("date") LocalDateTime date);
}
