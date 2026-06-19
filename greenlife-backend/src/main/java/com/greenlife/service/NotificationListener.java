package com.greenlife.service;

import com.greenlife.entity.*;
import com.greenlife.entity.enums.NotificationReferenceType;
import com.greenlife.entity.enums.NotificationType;
import com.greenlife.event.*;
import com.greenlife.repository.NotificationRepository;
import com.greenlife.repository.UserRepository;
import com.greenlife.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WishlistRepository wishlistRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderStatusEvent(OrderStatusEvent event) {
        User customer = userRepository.findById(event.getCustomerId()).orElse(null);
        if (customer == null) return;

        NotificationType type;
        String title;
        String message;

        switch (event.getStatus()) {
            case PENDING -> {
                type = NotificationType.ORDER_CREATED;
                title = "Đơn hàng mới đã được tạo";
                message = "Đơn hàng #" + event.getOrderId() + " của bạn đã được tạo thành công.";
            }
            case CONFIRMED -> {
                type = NotificationType.ORDER_CONFIRMED;
                title = "Đơn hàng đã được xác nhận";
                message = "Đơn hàng #" + event.getOrderId() + " của bạn đã được xác nhận bởi cửa hàng.";
            }
            case SHIPPING -> {
                type = NotificationType.ORDER_SHIPPING;
                title = "Đơn hàng đang được giao";
                message = "Đơn hàng #" + event.getOrderId() + " đang trên đường giao tới bạn.";
            }
            case DELIVERED -> {
                type = NotificationType.ORDER_DELIVERED;
                title = "Đơn hàng đã giao thành công";
                message = "Đơn hàng #" + event.getOrderId() + " đã được giao thành công.";
            }
            case CANCELLED -> {
                type = NotificationType.ORDER_CANCELLED;
                title = "Đơn hàng đã bị hủy";
                message = "Đơn hàng #" + event.getOrderId() + " đã bị hủy.";
            }
            default -> {
                return;
            }
        }

        Notification notification = Notification.builder()
                .user(customer)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(NotificationReferenceType.ORDER)
                .referenceId(event.getOrderId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        // Also notify Store Owner for ORDER_CREATED and ORDER_CANCELLED
        if (event.getStatus() == com.greenlife.entity.enums.OrderStatus.PENDING || event.getStatus() == com.greenlife.entity.enums.OrderStatus.CANCELLED) {
            User owner = userRepository.findById(event.getStoreOwnerId()).orElse(null);
            if (owner != null) {
                String ownerTitle = event.getStatus() == com.greenlife.entity.enums.OrderStatus.PENDING ? "Có đơn hàng mới" : "Đơn hàng đã bị hủy";
                String ownerMessage = event.getStatus() == com.greenlife.entity.enums.OrderStatus.PENDING ?
                        "Cửa hàng của bạn nhận được đơn hàng mới #" + event.getOrderId() :
                        "Đơn hàng #" + event.getOrderId() + " liên quan đến cửa hàng của bạn đã bị hủy.";

                Notification ownerNotification = Notification.builder()
                        .user(owner)
                        .type(type)
                        .title(ownerTitle)
                        .message(ownerMessage)
                        .referenceType(NotificationReferenceType.ORDER)
                        .referenceId(event.getOrderId())
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(ownerNotification);
            }
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePaymentEvent(PaymentEvent event) {
        User customer = userRepository.findById(event.getCustomerId()).orElse(null);
        if (customer == null) return;

        NotificationType type = event.isSuccess() ? NotificationType.PAYMENT_SUCCESS : NotificationType.PAYMENT_FAILED;
        String title = event.isSuccess() ? "Thanh toán thành công" : "Thanh toán thất bại";
        String message = event.isSuccess() ?
                "Giao dịch thanh toán cho đơn hàng #" + event.getOrderId() + " đã thành công." :
                "Giao dịch thanh toán cho đơn hàng #" + event.getOrderId() + " đã thất bại.";

        Notification notification = Notification.builder()
                .user(customer)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(NotificationReferenceType.PAYMENT)
                .referenceId(event.getOrderId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleReviewModerationEvent(ReviewModerationEvent event) {
        User customer = userRepository.findById(event.getCustomerId()).orElse(null);
        if (customer == null) return;

        Notification notification = Notification.builder()
                .user(customer)
                .type(NotificationType.REVIEW_HIDDEN)
                .title("Đánh giá của bạn đã bị ẩn")
                .message("Đánh giá của bạn đối với sản phẩm đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.")
                .referenceType(NotificationReferenceType.REVIEW)
                .referenceId(event.getReviewId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleWishlistRestockEvent(WishlistRestockEvent event) {
        List<WishlistItem> wishlistItems = wishlistRepository.findByPlantId(event.getPlantId());
        if (wishlistItems.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        for (WishlistItem item : wishlistItems) {
            Notification notification = Notification.builder()
                    .user(item.getCustomer())
                    .type(NotificationType.WISHLIST_RESTOCK)
                    .title("Sản phẩm yêu thích đã có hàng trở lại")
                    .message("Sản phẩm '" + event.getPlantName() + "' trong danh sách yêu thích của bạn hiện đã có hàng trở lại.")
                    .referenceType(NotificationReferenceType.PLANT)
                    .referenceId(event.getPlantId())
                    .isRead(false)
                    .createdAt(now)
                    .build();
            notificationRepository.save(notification);
        }
    }
}
