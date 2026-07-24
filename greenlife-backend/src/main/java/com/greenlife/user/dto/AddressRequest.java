package com.greenlife.user.dto;




import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 120, message = "Tên người nhận tối đa 120 ký tự")
    private String recipientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không đúng định dạng")
    private String phone;

    @NotBlank(message = "Địa chỉ nhà không được để trống")
    @Size(max = 255, message = "Địa chỉ nhà tối đa 255 ký tự")
    private String addressLine;

    @Size(max = 100, message = "Phường/Xã tối đa 100 ký tự")
    private String ward;

    @Size(max = 100, message = "Quận/Huyện tối đa 100 ký tự")
    private String district;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    @Size(max = 100, message = "Tỉnh/Thành phố tối đa 100 ký tự")
    private String city;

    private String provinceCode;

    private String communeCode;

    private String communeName;

    @Builder.Default
    private Boolean isDefault = false;
}
