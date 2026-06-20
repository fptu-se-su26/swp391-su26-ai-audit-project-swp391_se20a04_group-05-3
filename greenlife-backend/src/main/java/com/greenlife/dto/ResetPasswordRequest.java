package com.greenlife.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "\\d{6}", message = "Mã OTP phải có đúng 6 chữ số")
    private String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$",
            message = "Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất một chữ cái và một chữ số"
    )
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$",
            message = "Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất một chữ cái và một chữ số"
    )
    private String confirmPassword;
}
