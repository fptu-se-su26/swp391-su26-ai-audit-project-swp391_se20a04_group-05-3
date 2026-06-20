package com.greenlife.dto;

import com.greenlife.entity.enums.NotificationReferenceType;
import com.greenlife.entity.enums.NotificationType;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Integer id;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationReferenceType referenceType;
    private Integer referenceId;
    private boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
