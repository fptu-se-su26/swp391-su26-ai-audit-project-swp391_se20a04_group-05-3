package com.greenlife.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiErrorResponse {
    private String error;
    private LocalDateTime timestamp;
    private String path;
}
