package com.greenlife.dto;

import com.greenlife.entity.enums.UserStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private UserStatus status;
    private Boolean emailVerified;
    private Integer failedLoginAttempts;
    private LocalDateTime lockoutEnd;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
