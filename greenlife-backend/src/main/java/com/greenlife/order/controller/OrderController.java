package com.greenlife.order.controller;

import com.greenlife.order.dto.OrderResponse;
import com.greenlife.order.dto.ReturnRequestRequest;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.order.service.OrderService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CurrentUserResolver currentUserResolver;









    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal UserDetails userDetails) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.getCustomerOrders(user.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> getOrderDetails(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.getCustomerOrderDetail(user.getId(), id));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.cancelCustomerOrder(user.getId(), id));
    }

    @PutMapping("/{id}/received")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> confirmReceived(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.confirmReceivedCustomerOrder(user.getId(), id));
    }

    @PutMapping("/{id}/return-request")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> requestReturn(
            @PathVariable Integer id,
            @RequestBody ReturnRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(orderService.requestReturnCustomerOrder(user.getId(), id, request));
    }

    @PostMapping("/{id}/return-evidence/upload")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<java.util.Map<String, String>> uploadReturnEvidence(
            @PathVariable Integer id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        String url = orderService.uploadReturnEvidence(user.getId(), id, file);
        return ResponseEntity.ok(java.util.Map.of("url", url));
    }
}
