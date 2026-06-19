package com.greenlife.service;

import com.greenlife.dto.BroadcastRequest;
import com.greenlife.dto.NotificationResponse;
import com.greenlife.entity.Notification;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.NotificationReferenceType;
import com.greenlife.entity.enums.NotificationType;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.NotificationRepository;
import com.greenlife.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Integer userId, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 100);
        Pageable cappedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageSize
        );
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, cappedPageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Integer userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Integer userId, Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException("Thông báo không tồn tại", HttpStatus.NOT_FOUND));

        if (!notification.getUser().getId().equals(userId)) {
            throw new CustomException("Bạn không có quyền truy cập thông báo này", HttpStatus.FORBIDDEN);
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        return mapToResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(Integer userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    @Transactional
    public void deleteNotification(Integer userId, Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException("Thông báo không tồn tại", HttpStatus.NOT_FOUND));

        if (!notification.getUser().getId().equals(userId)) {
            throw new CustomException("Bạn không có quyền xóa thông báo này", HttpStatus.FORBIDDEN);
        }

        notificationRepository.delete(notification);
    }

    @Transactional
    public void broadcastAnnouncement(BroadcastRequest request) {
        List<User> activeUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        for (User user : activeUsers) {
            Notification notification = Notification.builder()
                    .user(user)
                    .type(NotificationType.SYSTEM_ANNOUNCEMENT)
                    .title(request.getTitle())
                    .message(request.getMessage())
                    .referenceType(NotificationReferenceType.SYSTEM)
                    .referenceId(0)
                    .isRead(false)
                    .createdAt(now)
                    .build();
            notificationRepository.save(notification);
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getAdminNotifications(Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 100);
        Pageable cappedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageSize
        );
        return notificationRepository.findAllByOrderByCreatedAtDesc(cappedPageable)
                .map(this::mapToResponse);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
