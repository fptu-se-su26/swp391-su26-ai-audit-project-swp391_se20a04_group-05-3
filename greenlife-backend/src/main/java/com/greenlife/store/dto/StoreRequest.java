package com.greenlife.store.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreRequest {

    @NotBlank(message = "Tên cửa hàng không được để trống")
    @Size(max = 150, message = "Tên cửa hàng không được vượt quá 150 ký tự")
    private String name;

    @Pattern(regexp = "^$|[0-9]{10,11}", message = "Số điện thoại cửa hàng phải chứa 10-11 chữ số")
    private String phone;

    @Size(max = 100, message = "Tên thành phố không được vượt quá 100 ký tự")
    private String city;

    @Size(max = 100, message = "Tên quận/huyện không được vượt quá 100 ký tự")
    private String district;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    @Size(max = 255, message = "Địa chỉ chi tiết không được vượt quá 255 ký tự")
    private String address;

    private String description;

    @Size(max = 500, message = "Đường dẫn ảnh logo không được vượt quá 500 ký tự")
    private String logoUrl;

    @Size(max = 7000000, message = "Tài liệu xác minh không được vượt quá 7,000,000 ký tự")
    private String verificationDocument;

    @Email(message = "Email đối tác không hợp lệ")
    private String shopEmail;

    private String businessType;

    private String cccdFrontUrl;

    private String cccdBackUrl;

    private java.util.List<String> businessEvidenceUrls;
}
