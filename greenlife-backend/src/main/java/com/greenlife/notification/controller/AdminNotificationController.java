package com.greenlife.notification.controller;

import com.greenlife.notification.dto.BroadcastRequest;
import com.greenlife.notification.dto.NotificationResponse;
import com.greenlife.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcastAnnouncement(@Valid @RequestBody BroadcastRequest request) {
        notificationService.broadcastAnnouncement(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getAdminNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getAdminNotifications(pageable));
    }
}
