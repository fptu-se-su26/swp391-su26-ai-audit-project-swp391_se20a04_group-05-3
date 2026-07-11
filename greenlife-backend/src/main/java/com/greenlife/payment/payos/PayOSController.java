package com.greenlife.payment.payos;

import com.greenlife.payment.payos.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/payos")
@RequiredArgsConstructor
public class PayOSController {

    private final PayOSService payOSService;

    @PostMapping("/create-link")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<PayOSPaymentLinkData> createLink(
            @RequestBody PayOSCreateLinkRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(payOSService.createPayOSPaymentLink(request.getOrderId(), userDetails.getUsername()));
    }

    @GetMapping("/{orderCode}/status")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<PayOSStatusResponse> getStatus(
            @PathVariable Long orderCode,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(payOSService.getPayOSPaymentStatus(orderCode, userDetails.getUsername()));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> webhook(@RequestBody PayOSWebhookPayload payload) {
        return ResponseEntity.ok(payOSService.processPayOSWebhook(payload));
    }
}
