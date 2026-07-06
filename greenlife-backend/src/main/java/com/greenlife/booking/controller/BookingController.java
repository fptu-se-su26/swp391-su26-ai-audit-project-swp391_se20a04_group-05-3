package com.greenlife.booking.controller;

import com.greenlife.booking.dto.BookingCancelRequest;
import com.greenlife.booking.dto.BookingRequest;
import com.greenlife.booking.dto.BookingResponse;
import com.greenlife.booking.dto.BookingStatusUpdateRequest;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        BookingResponse created = bookingService.createBooking(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<BookingResponse>> getCustomerBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.listCustomerBookings(user.getId(), page, size));
    }

    @GetMapping("/store")
    @PreAuthorize("hasRole('STORE_OWNER')")
    public ResponseEntity<Page<BookingResponse>> getStoreBookings(
            @RequestParam Integer storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.listStoreBookings(user.getId(), storeId, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getBookingDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.getBookingDetail(user.getId(), id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('STORE_OWNER')")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable Integer id,
            @Valid @RequestBody BookingStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.updateBookingStatus(user.getId(), id, request));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Integer id,
            @Valid @RequestBody BookingCancelRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(bookingService.cancelBooking(user.getId(), id, request));
    }








}
