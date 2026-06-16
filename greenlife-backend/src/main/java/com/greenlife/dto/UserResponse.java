package com.greenlife.dto;

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
    private String status;
    private Boolean emailVerified;
}
