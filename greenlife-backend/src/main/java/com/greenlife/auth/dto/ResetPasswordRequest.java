package com.greenlife.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequest {

    private String email;

    private String otp;

    private String resetToken;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$",
            message = "Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất một chữ cái và một chữ số"
    )
    private String newPassword;

    private String confirmPassword;
}
