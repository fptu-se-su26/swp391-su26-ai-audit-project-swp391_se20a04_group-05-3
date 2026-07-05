package com.greenlife.booking.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingCancelRequest {

    @NotBlank(message = "Lý do hủy lịch hẹn không được để trống")
    @Size(max = 500, message = "Lý do hủy không được vượt quá 500 ký tự")
    private String cancelReason;
}
