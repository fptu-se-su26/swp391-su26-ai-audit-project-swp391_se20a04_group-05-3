package com.greenlife.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$", message = "Mật khẩu mới phải từ 8 đến 64 ký tự và chứa ít nhất một chữ cái và một chữ số")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$", message = "Mật khẩu xác nhận phải từ 8 đến 64 ký tự và chứa ít nhất một chữ cái và một chữ số")
    private String confirmPassword;
}
