package com.greenlife.payment.controller;

import com.greenlife.payment.dto.PaymentUrlRequest;
import com.greenlife.payment.dto.PaymentUrlResponse;
import com.greenlife.order.dto.OrderResponse;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping("/vnpay/url")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PaymentUrlResponse> generatePaymentUrl(
            @Valid @RequestBody PaymentUrlRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest
    ) {
        User user = currentUserResolver.resolveUser(userDetails);

        String clientIp = httpServletRequest.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = httpServletRequest.getRemoteAddr();
        }

        PaymentUrlResponse response = paymentService.generatePaymentUrl(request, user, clientIp);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vnpay-callback")
    public ResponseEntity<OrderResponse> handleVNPayCallback(@RequestParam Map<String, String> params) {
        OrderResponse response = paymentService.processVNPayCallback(params);
        return ResponseEntity.ok(response);
    }
}
