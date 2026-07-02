package com.greenlife.dto;

import com.greenlife.entity.enums.UserStatus;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String avatarUrl;
    private String role;
    private UserStatus status;
    private Boolean emailVerified;
}

