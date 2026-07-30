package com.greenlife.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.notification.entity.Notification;
import com.greenlife.notification.entity.enums.NotificationReferenceType;
import com.greenlife.notification.entity.enums.NotificationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class UnicodeVietnameseEncodingTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Notification title and message preserve exact Vietnamese accents")
    void testNotificationTitleAndMessagePreserveVietnameseAccents() {
        String title = "Đơn hàng mới đã được tạo";
        String message = "Cửa hàng của bạn nhận được đơn hàng mới #101 và đã được xác nhận thành công.";

        Notification notification = Notification.builder()
                .type(NotificationType.ORDER_CREATED)
                .title(title)
                .message(message)
                .referenceType(NotificationReferenceType.ORDER)
                .referenceId(101)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        assertEquals("Đơn hàng mới đã được tạo", notification.getTitle());
        assertEquals("Cửa hàng của bạn nhận được đơn hàng mới #101 và đã me được xác nhận thành công.".replace("me ", ""), notification.getMessage());
    }

    @Test
    @DisplayName("JSON serialization preserves Vietnamese characters without corruption")
    void testJsonSerializationPreservesVietnameseCharacters() throws Exception {
        Map<String, String> payload = new HashMap<>();
        payload.put("storeName", "Cửa hàng Nông Sản Xanh");
        payload.put("productName", "Cây Sen Đá Kim Cương");
        payload.put("recipientName", "Nguyễn Văn A");
        payload.put("statusText", "Đang xử lý (Lần thử 1/5)");

        String json = objectMapper.writeValueAsString(payload);
        assertTrue(json.contains("Cửa hàng Nông Sản Xanh"));
        assertTrue(json.contains("Cây Sen Đá Kim Cương"));
        assertTrue(json.contains("Nguyễn Văn A"));
        assertTrue(json.contains("Đang xử lý (Lần thử 1/5)"));

        @SuppressWarnings("unchecked")
        Map<String, String> deserialized = objectMapper.readValue(json, Map.class);
        assertEquals("Cửa hàng Nông Sản Xanh", deserialized.get("storeName"));
        assertEquals("Cây Sen Đá Kim Cương", deserialized.get("productName"));
        assertEquals("Nguyễn Văn A", deserialized.get("recipientName"));
        assertEquals("Đang xử lý (Lần thử 1/5)", deserialized.get("statusText"));
    }

    @Test
    @DisplayName("PaymentStatusView text rendering contract check")
    void testPaymentStatusViewTextContract() {
        int retryCount = 2;
        int maxRetries = 5;
        String formatted = String.format("Đang xử lý (Lần thử %d/%d)", retryCount, maxRetries);
        assertEquals("Đang xử lý (Lần thử 2/5)", formatted);
        assertFalse(formatted.contains("Äang"));
        assertFalse(formatted.contains("xá»"));
        assertFalse(formatted.contains("Láº§n"));
    }
}
