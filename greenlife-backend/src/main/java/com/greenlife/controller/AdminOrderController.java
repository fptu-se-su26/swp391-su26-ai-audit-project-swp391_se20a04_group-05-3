package com.greenlife.controller;

import com.greenlife.dto.OrderResponse;
import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.UserRepository;
import com.greenlife.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(@AuthenticationPrincipal UserDetails userDetails) {
        getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(orderService.getOrderDetailsForAdmin(id));
    }
}
