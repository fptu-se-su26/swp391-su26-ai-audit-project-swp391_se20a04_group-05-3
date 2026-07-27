package com.greenlife.auth.entity;

import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.enums.SecurityAuditAction;
import com.greenlife.auth.entity.enums.SuspiciousActivityType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_audits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(name = "email", length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SecurityAuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "suspicious_activity_type", length = 50)
    private SuspiciousActivityType suspiciousActivityType;

    @Column(length = 500)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
