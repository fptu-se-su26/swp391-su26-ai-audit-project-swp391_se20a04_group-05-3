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

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String serviceAddress;

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String customerAddress;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String customerPhone;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String customerNote;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String issueDescription;
}
