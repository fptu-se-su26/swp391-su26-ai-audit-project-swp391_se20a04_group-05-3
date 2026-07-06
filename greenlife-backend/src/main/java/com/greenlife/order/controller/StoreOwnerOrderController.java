package com.greenlife.order.controller;

import com.greenlife.order.dto.OrderResponse;
import com.greenlife.order.dto.UpdateOrderStatusRequest;
import com.greenlife.user.entity.User;

import com.greenlife.security.CurrentUserResolver;
import com.greenlife.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store-owner/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STORE_OWNER')")
public class StoreOwnerOrderController {

    private final OrderService orderService;
    private final CurrentUserResolver currentUserResolver;









    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyStoreOrders(@AuthenticationPrincipal UserDetails userDetails) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.getStoreOwnerOrders(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getStoreOrderDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.getStoreOwnerOrderDetail(user.getId(), id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStoreOrderStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.updateStoreOwnerOrderStatus(user.getId(), id, request.getStatus()));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelStoreOrder(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.cancelStoreOwnerOrder(user.getId(), id));
    }
}
