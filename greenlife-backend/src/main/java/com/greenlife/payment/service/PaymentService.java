package com.greenlife.payment.service;

import com.greenlife.order.dto.OrderResponse;
import com.greenlife.order.entity.Order;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.order.service.OrderService;
import com.greenlife.payment.dto.PaymentUrlRequest;
import com.greenlife.payment.dto.PaymentUrlResponse;
import com.greenlife.user.entity.User;
import com.greenlife.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public PaymentUrlResponse generatePaymentUrl(PaymentUrlRequest request, User currentUser, String clientIp) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND));

        if (!order.getCustomer().getId().equals(currentUser.getId())) {
            throw new CustomException("Bạn không có quyền thanh toán đơn hàng này", HttpStatus.FORBIDDEN);
        }

        if (!"VNPAY".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new CustomException("Đơn hàng không sử dụng phương thức thanh toán VNPay", HttpStatus.BAD_REQUEST);
        }

        String paymentUrl = orderService.getVNPayUrl(order, clientIp);
        return new PaymentUrlResponse(paymentUrl);
    }

    public OrderResponse processVNPayCallback(Map<String, String> params) {
        return orderService.processVNPayCallback(params);
    }
}
