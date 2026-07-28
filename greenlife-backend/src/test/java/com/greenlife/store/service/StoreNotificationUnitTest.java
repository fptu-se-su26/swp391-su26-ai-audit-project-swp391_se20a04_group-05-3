package com.greenlife.store.service;

import com.greenlife.common.service.FileStorageService;
import com.greenlife.exception.InvalidStoreStatusTransitionException;
import com.greenlife.notification.entity.Notification;
import com.greenlife.notification.entity.enums.NotificationReferenceType;
import com.greenlife.notification.entity.enums.NotificationType;
import com.greenlife.notification.repository.NotificationRepository;
import com.greenlife.store.dto.ApproveStoreRequest;
import com.greenlife.store.dto.RejectStoreRequest;
import com.greenlife.store.dto.StoreResponse;
import com.greenlife.store.entity.Store;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.store.repository.StoreApprovalAuditRepository;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StoreNotificationUnitTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StoreApprovalAuditRepository storeApprovalAuditRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private com.greenlife.auth.service.OtpService otpService;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private StoreService storeService;

    private User owner;
    private User admin;
    private Store pendingStore;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        Role customerRole = Role.builder().id(1).name("CUSTOMER").build();
        Role storeOwnerRole = Role.builder().id(2).name("STORE_OWNER").build();

        owner = User.builder()
                .id(10)
                .email("owner@test.com")
                .role(customerRole)
                .build();

        admin = User.builder()
                .id(99)
                .email("admin@test.com")
                .role(Role.builder().id(3).name("ADMIN").build())
                .build();

        pendingStore = Store.builder()
                .id(50)
                .name("Vườn Nho Xanh")
                .owner(owner)
                .status(StoreStatus.PENDING)
                .build();

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(roleRepository.findByName("STORE_OWNER")).thenReturn(Optional.of(storeOwnerRole));
        when(storeRepository.save(any(Store.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testApproveStore_SavesPersistentNotification() {
        when(storeRepository.findById(50)).thenReturn(Optional.of(pendingStore));

        ApproveStoreRequest req = new ApproveStoreRequest();
        req.setReason("Hồ sơ hợp lệ");

        StoreResponse response = storeService.approveStore(50, req, "admin@test.com");

        assertNotNull(response);
        assertEquals(StoreStatus.APPROVED, response.getStatus());

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(notifCaptor.capture());

        Notification savedNotif = notifCaptor.getValue();
        assertEquals(owner, savedNotif.getUser());
        assertEquals(NotificationType.STORE_APPROVED, savedNotif.getType());
        assertEquals(NotificationReferenceType.STORE, savedNotif.getReferenceType());
        assertEquals(50, savedNotif.getReferenceId());
        assertEquals("Cửa hàng đã được phê duyệt", savedNotif.getTitle());
        assertTrue(savedNotif.getMessage().contains("Vườn Nho Xanh"));
        assertFalse(savedNotif.isRead());
    }

    @Test
    void testRejectStore_WithReason_SavesPersistentNotification() {
        when(storeRepository.findById(50)).thenReturn(Optional.of(pendingStore));

        RejectStoreRequest req = new RejectStoreRequest();
        req.setReason("Thiếu giấy phép kinh doanh");

        StoreResponse response = storeService.rejectStore(50, req, "admin@test.com");

        assertNotNull(response);
        assertEquals(StoreStatus.REJECTED, response.getStatus());

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(notifCaptor.capture());

        Notification savedNotif = notifCaptor.getValue();
        assertEquals(owner, savedNotif.getUser());
        assertEquals(NotificationType.STORE_REJECTED, savedNotif.getType());
        assertEquals(NotificationReferenceType.STORE, savedNotif.getReferenceType());
        assertEquals(50, savedNotif.getReferenceId());
        assertEquals("Yêu cầu đăng ký cửa hàng bị từ chối", savedNotif.getTitle());
        assertTrue(savedNotif.getMessage().contains("Lý do: Thiếu giấy phép kinh doanh"));
        assertFalse(savedNotif.isRead());
    }

    @Test
    void testRejectStore_NullReason_UsesFallbackMessage() {
        when(storeRepository.findById(50)).thenReturn(Optional.of(pendingStore));

        RejectStoreRequest req = new RejectStoreRequest();
        req.setReason(null);

        StoreResponse response = storeService.rejectStore(50, req, "admin@test.com");

        assertNotNull(response);

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(notifCaptor.capture());

        Notification savedNotif = notifCaptor.getValue();
        assertTrue(savedNotif.getMessage().contains("Vui lòng kiểm tra lại thông tin đăng ký"));
    }

    @Test
    void testApproveStore_InvalidStatusTransition_DoesNotSaveNotification() {
        pendingStore.setStatus(StoreStatus.APPROVED);
        when(storeRepository.findById(50)).thenReturn(Optional.of(pendingStore));

        ApproveStoreRequest req = new ApproveStoreRequest();

        assertThrows(InvalidStoreStatusTransitionException.class, () -> {
            storeService.approveStore(50, req, "admin@test.com");
        });

        verify(notificationRepository, never()).save(any());
    }
}
