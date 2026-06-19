package com.greenlife.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUrlRequest {
    @NotNull(message = "Mã đơn hàng không được để trống")
    private Integer orderId;
}
