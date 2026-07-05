package com.greenlife.booking.service;

import com.greenlife.booking.dto.BookingCancelRequest;
import com.greenlife.booking.dto.BookingRequest;
import com.greenlife.booking.dto.BookingResponse;
import com.greenlife.booking.dto.BookingStatusUpdateRequest;
import com.greenlife.booking.entity.Booking;
import com.greenlife.booking.entity.PlantCareService;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.User;
import com.greenlife.notification.entity.Notification;
import com.greenlife.booking.entity.enums.BookingStatus;
import com.greenlife.booking.entity.enums.ServiceStatus;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.notification.entity.enums.NotificationType;
import com.greenlife.notification.entity.enums.NotificationReferenceType;
import com.greenlife.exception.CustomException;
import com.greenlife.booking.repository.BookingRepository;
import com.greenlife.notification.repository.NotificationRepository;
import com.greenlife.booking.repository.PlantCareServiceRepository;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PlantCareServiceRepository serviceRepository;
    private final StoreRepository storeRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public BookingResponse createBooking(Integer currentUserId, BookingRequest request) {
        User customer = userRepository.findById(currentUserId)
                .orElseThrow(() -> new CustomException("Khách hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (customer.getStatus() != UserStatus.ACTIVE) {
            throw new CustomException("Tài khoản khách hàng không ở trạng thái hoạt động", HttpStatus.BAD_REQUEST);
        }

        // Limit check: max 5 active bookings
        long activeBookingsCount = bookingRepository.countByCustomerIdAndStatusIn(
                currentUserId,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS)
        );
        if (activeBookingsCount >= 5) {
            throw new CustomException("Bạn không thể có nhiều hơn 5 lịch hẹn đang hoạt động", HttpStatus.BAD_REQUEST);
        }

        PlantCareService service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new CustomException("Dịch vụ không tồn tại", HttpStatus.NOT_FOUND));

        if (service.getStatus() != ServiceStatus.ACTIVE) {
            throw new CustomException("Dịch vụ không hoạt động hoặc đã bị vô hiệu hóa", HttpStatus.BAD_REQUEST);
        }

        Store store = service.getStore();
        if (store.getStatus() != StoreStatus.APPROVED) {
            throw new CustomException("Cửa hàng cung cấp dịch vụ hiện không hoạt động", HttpStatus.BAD_REQUEST);
        }

        // Validation: scheduledAt >= now + 2h
        if (request.getScheduledAt().isBefore(LocalDateTime.now().plusHours(2))) {
            throw new CustomException("Thời gian đặt lịch hẹn phải cách thời gian hiện tại ít nhất 2 giờ", HttpStatus.BAD_REQUEST);
        }

        // Validation: block duplicate bookings for same service, scheduled date/time, and status PENDING, CONFIRMED, IN_PROGRESS
        boolean hasOverlap = bookingRepository.existsByServiceIdAndScheduledAtAndStatusIn(
                request.getServiceId(),
                request.getScheduledAt(),
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS)
        );
        if (hasOverlap) {
            throw new CustomException("Dịch vụ này đã có lịch hẹn được đặt vào thời gian đã chọn", HttpStatus.BAD_REQUEST);
        }

        Booking booking = Booking.builder()
                .customer(customer)
                .store(store)
                .service(service)
                .serviceNameSnapshot(service.getName())
                .servicePriceSnapshot(service.getPrice())
                .storeNameSnapshot(store.getName())
                .scheduledAt(request.getScheduledAt())
                .serviceAddress(request.getServiceAddress())
                .customerNote(request.getCustomerNote())
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .version(0L)
                .build();

        Booking saved = bookingRepository.save(booking);

        // Notify store owner
        Notification notification = Notification.builder()
                .user(store.getOwner())
                .type(NotificationType.BOOKING_CREATED)
                .title("Lịch hẹn mới đã được tạo")
                .message("Khách hàng " + customer.getFullName() + " đã đặt lịch hẹn cho dịch vụ: " + service.getName())
                .referenceType(NotificationReferenceType.BOOKING)
                .referenceId(saved.getId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse updateBookingStatus(Integer currentUserId, Integer bookingId, BookingStatusUpdateRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new CustomException("Lịch hẹn không tồn tại", HttpStatus.NOT_FOUND));


        // Ownership: Only the store owner of the store providing the service can change status
        if (!booking.getStore().getOwner().getId().equals(currentUserId)) {
            throw new CustomException("Bạn không có quyền quản lý lịch hẹn của cửa hàng này", HttpStatus.FORBIDDEN);
        }

        // Validate Store status
        if (booking.getStore().getStatus() != StoreStatus.APPROVED) {
            throw new CustomException("Cửa hàng không ở trạng thái hoạt động (APPROVED)", HttpStatus.BAD_REQUEST);
        }

        BookingStatus current = booking.getStatus();
        BookingStatus target = request.getStatus();

        if (target == BookingStatus.CONFIRMED) {
            if (current != BookingStatus.PENDING) {
                throw new CustomException("Trạng thái chuyển đổi không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            booking.setConfirmedAt(LocalDateTime.now());
        } else if (target == BookingStatus.IN_PROGRESS) {
            if (current != BookingStatus.CONFIRMED) {
                throw new CustomException("Trạng thái chuyển đổi không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            booking.setStartedAt(LocalDateTime.now());
        } else if (target == BookingStatus.COMPLETED) {
            if (current != BookingStatus.IN_PROGRESS) {
                throw new CustomException("Trạng thái chuyển đổi không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            booking.setCompletedAt(LocalDateTime.now());
        } else {
            throw new CustomException("Trạng thái chuyển đổi không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        booking.setStatus(target);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);

        // Notify customer
        NotificationType notifType = target == BookingStatus.CONFIRMED ? NotificationType.BOOKING_CONFIRMED :
                (target == BookingStatus.IN_PROGRESS ? NotificationType.BOOKING_IN_PROGRESS : NotificationType.BOOKING_COMPLETED);

        String title = target == BookingStatus.CONFIRMED ? "Lịch hẹn đã được xác nhận" :
                (target == BookingStatus.IN_PROGRESS ? "Dịch vụ đang thực hiện" : "Lịch hẹn đã hoàn thành");

        String msg = target == BookingStatus.CONFIRMED ? "Lịch hẹn của bạn cho dịch vụ " + booking.getServiceNameSnapshot() + " đã được xác nhận." :
                (target == BookingStatus.IN_PROGRESS ? "Dịch vụ " + booking.getServiceNameSnapshot() + " đang được thực hiện." :
                        "Lịch hẹn của bạn cho dịch vụ " + booking.getServiceNameSnapshot() + " đã hoàn thành.");

        Notification notification = Notification.builder()
                .user(booking.getCustomer())
                .type(notifType)
                .title(title)
                .message(msg)
                .referenceType(NotificationReferenceType.BOOKING)
                .referenceId(saved.getId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(Integer currentUserId, Integer bookingId, BookingCancelRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new CustomException("Lịch hẹn không tồn tại", HttpStatus.NOT_FOUND));


        boolean isCustomer = booking.getCustomer().getId().equals(currentUserId);
        boolean isStoreOwner = booking.getStore().getOwner().getId().equals(currentUserId);

        if (!isCustomer && !isStoreOwner) {
            throw new CustomException("Bạn không có quyền hủy lịch hẹn này", HttpStatus.FORBIDDEN);
        }

        // Validate Store status only if action is performed by Store Owner
        if (isStoreOwner && booking.getStore().getStatus() != StoreStatus.APPROVED) {
            throw new CustomException("Cửa hàng không ở trạng thái hoạt động (APPROVED)", HttpStatus.BAD_REQUEST);
        }

        BookingStatus current = booking.getStatus();

        // Customer can cancel: PENDING, CONFIRMED
        // Store Owner can cancel: PENDING, CONFIRMED, IN_PROGRESS
        if (isCustomer) {
            if (current != BookingStatus.PENDING && current != BookingStatus.CONFIRMED) {
                throw new CustomException("Không thể hủy lịch hẹn ở trạng thái hiện tại", HttpStatus.BAD_REQUEST);
            }
        } else {
            if (current != BookingStatus.PENDING && current != BookingStatus.CONFIRMED && current != BookingStatus.IN_PROGRESS) {
                throw new CustomException("Không thể hủy lịch hẹn ở trạng thái hiện tại", HttpStatus.BAD_REQUEST);
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(request.getCancelReason());
        booking.setCancelledAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);

        // Notify counterparty
        User notifyUser = isCustomer ? booking.getStore().getOwner() : booking.getCustomer();
        Notification notification = Notification.builder()
                .user(notifyUser)
                .type(NotificationType.BOOKING_CANCELLED)
                .title("Lịch hẹn đã bị hủy")
                .message("Lịch hẹn cho dịch vụ " + booking.getServiceNameSnapshot() + " đã bị hủy. Lý do: " + request.getCancelReason())
                .referenceType(NotificationReferenceType.BOOKING)
                .referenceId(saved.getId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> listCustomerBookings(Integer customerId, int page, int size) {
        int cappedSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return bookingRepository.findByCustomerId(customerId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> listStoreBookings(Integer currentUserId, Integer storeId, int page, int size) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (!store.getOwner().getId().equals(currentUserId)) {
            throw new CustomException("Bạn không có quyền truy cập lịch hẹn của cửa hàng này", HttpStatus.FORBIDDEN);
        }

        int cappedSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.ASC, "scheduledAt"));
        return bookingRepository.findByStoreId(storeId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingDetail(Integer currentUserId, Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new CustomException("Lịch hẹn không tồn tại", HttpStatus.NOT_FOUND));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new CustomException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        boolean hasAccess = booking.getCustomer().getId().equals(currentUserId) ||
                booking.getStore().getOwner().getId().equals(currentUserId) ||
                user.getRole().getName().equals("ADMIN");

        if (!hasAccess) {
            throw new CustomException("Bạn không có quyền truy cập lịch hẹn này", HttpStatus.FORBIDDEN);
        }

        return mapToResponse(booking);
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .customerId(booking.getCustomer().getId())
                .customerName(booking.getCustomer().getFullName())
                .storeId(booking.getStore().getId())
                .storeNameSnapshot(booking.getStoreNameSnapshot())
                .serviceId(booking.getService().getId())
                .serviceNameSnapshot(booking.getServiceNameSnapshot())
                .servicePriceSnapshot(booking.getServicePriceSnapshot())
                .scheduledAt(booking.getScheduledAt())
                .serviceAddress(booking.getServiceAddress())
                .customerNote(booking.getCustomerNote())
                .status(booking.getStatus())
                .cancelReason(booking.getCancelReason())
                .confirmedAt(booking.getConfirmedAt())
                .startedAt(booking.getStartedAt())
                .completedAt(booking.getCompletedAt())
                .cancelledAt(booking.getCancelledAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .version(booking.getVersion())
                .build();
    }
}
