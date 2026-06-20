package com.greenlife.dto;

import com.greenlife.entity.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingStatusUpdateRequest {
    @NotNull(message = "Trạng thái cập nhật không được để trống")
    private BookingStatus status;
}
