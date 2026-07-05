package com.greenlife.auth.entity;

import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.enums.LoginFailureReason;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_audits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true, updatable = false)
    private User user;

    @Column(nullable = false, length = 255, updatable = false)
    private String email;

    @Column(nullable = false, updatable = false)
    private boolean success;

    @Column(name = "ip_address", length = 100, updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", length = 500, updatable = false)
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(name = "failure_reason", length = 255, updatable = false)
    private LoginFailureReason failureReason;

    @Column(name = "login_time", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime loginTime = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.userAgent != null && this.userAgent.length() > 500) {
            this.userAgent = this.userAgent.substring(0, 500);
        }
        if (this.loginTime == null) {
            this.loginTime = LocalDateTime.now();
        }
    }
}
