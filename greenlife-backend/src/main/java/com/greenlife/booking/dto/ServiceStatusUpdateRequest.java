package com.greenlife.booking.dto;

import com.greenlife.booking.entity.enums.ServiceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceStatusUpdateRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private ServiceStatus status;
}
