package com.greenlife.auth.entity;

import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.enums.OtpPurpose;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User cannot be null")
    private User user;

    @Column(name = "otp_hash", nullable = false, length = 64)
    @NotBlank(message = "OTP hash cannot be blank")
    @Size(max = 64, message = "OTP hash must not exceed 64 characters")
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @NotNull(message = "Purpose cannot be null")
    private OtpPurpose purpose;

    @Column(nullable = false)
    @Min(value = 0, message = "Attempts cannot be negative")
    @Builder.Default
    private Integer attempts = 0;

    @Column(name = "expires_at", nullable = false)
    @NotNull(message = "Expires at cannot be null")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.attempts == null) {
            this.attempts = 0;
        }
    }
}
