package com.greenlife.order.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    private Integer addressId;

    @Size(max = 120, message = "Tên người nhận tối đa 120 ký tự")
    private String recipientName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String recipientPhone;

    @Size(max = 255, message = "Địa chỉ giao hàng tối đa 255 ký tự")
    private String shippingAddress;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;

    @Pattern(regexp = "COD|PAYOS", message = "Phương thức thanh toán phải là COD hoặc PAYOS")
    @Builder.Default
    private String paymentMethod = "COD";
}
