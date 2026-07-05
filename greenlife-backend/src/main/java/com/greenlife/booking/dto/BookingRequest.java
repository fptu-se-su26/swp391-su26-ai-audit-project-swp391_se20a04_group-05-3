package com.greenlife.booking.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    @NotNull(message = "ID dịch vụ không được để trống")
    private Integer serviceId;

    @NotNull(message = "Thời gian hẹn không được để trống")
    private LocalDateTime scheduledAt;

    @NotBlank(message = "Địa chỉ thực hiện dịch vụ không được để trống")
    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String serviceAddress;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String customerNote;
}
