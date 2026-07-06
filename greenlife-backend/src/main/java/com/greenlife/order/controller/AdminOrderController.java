package com.greenlife.order.controller;

import com.greenlife.order.dto.OrderResponse;

import com.greenlife.security.CurrentUserResolver;
import com.greenlife.order.service.OrderService;
import lombok.RequiredArgsConstructor;

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
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(@AuthenticationPrincipal UserDetails userDetails) {
        currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) {
        currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.getOrderDetailsForAdmin(id));
    }
}
