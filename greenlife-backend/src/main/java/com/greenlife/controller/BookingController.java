package com.greenlife.controller;

import com.greenlife.dto.BookingCancelRequest;
import com.greenlife.dto.BookingRequest;
import com.greenlife.dto.BookingResponse;
import com.greenlife.dto.BookingStatusUpdateRequest;
import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.UserRepository;
import com.greenlife.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        BookingResponse created = bookingService.createBooking(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/customer")
    public ResponseEntity<Page<BookingResponse>> getCustomerBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.listCustomerBookings(user.getId(), page, size));
    }

    @GetMapping("/store")
    public ResponseEntity<Page<BookingResponse>> getStoreBookings(
            @RequestParam Integer storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.listStoreBookings(user.getId(), storeId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.getBookingDetail(user.getId(), id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable Integer id,
            @Valid @RequestBody BookingStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.updateBookingStatus(user.getId(), id, request));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Integer id,
            @Valid @RequestBody BookingCancelRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.cancelBooking(user.getId(), id, request));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }
}
