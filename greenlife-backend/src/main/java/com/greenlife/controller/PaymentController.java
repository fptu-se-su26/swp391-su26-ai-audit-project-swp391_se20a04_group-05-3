package com.greenlife.controller;

import com.greenlife.dto.PaymentUrlRequest;
import com.greenlife.dto.PaymentUrlResponse;
import com.greenlife.dto.OrderResponse;
import com.greenlife.entity.Order;
import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.OrderRepository;
import com.greenlife.repository.UserRepository;
import com.greenlife.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @PostMapping("/vnpay/url")
    public ResponseEntity<PaymentUrlResponse> generatePaymentUrl(
            @Valid @RequestBody PaymentUrlRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest
    ) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND));

        // Ownership validation
        if (!order.getCustomer().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền thanh toán đơn hàng này", HttpStatus.FORBIDDEN);
        }

        if (!"VNPAY".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new CustomException("Đơn hàng không sử dụng phương thức thanh toán VNPay", HttpStatus.BAD_REQUEST);
        }

        String clientIp = httpServletRequest.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = httpServletRequest.getRemoteAddr();
        }

        String paymentUrl = orderService.getVNPayUrl(order, clientIp);
        return ResponseEntity.ok(new PaymentUrlResponse(paymentUrl));
    }

    @GetMapping("/vnpay-callback")
    public ResponseEntity<OrderResponse> handleVNPayCallback(@RequestParam Map<String, String> params) {
        OrderResponse response = orderService.processVNPayCallback(params);
        return ResponseEntity.ok(response);
    }
}
