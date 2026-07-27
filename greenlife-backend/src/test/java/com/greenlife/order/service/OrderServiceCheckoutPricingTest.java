package com.greenlife.order.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.dto.CheckoutRequest;
import com.greenlife.order.dto.OrderResponse;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.OrderDetail;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.event.OrderStatusEvent;
import com.greenlife.plant.entity.Plant;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceCheckoutPricingTest {

    @Mock private CheckoutPricingReservationService checkoutPricingReservationService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private OrderService orderService;

    private User customer;
    private Store store;
    private Plant plant;
    private Order order;
    private OrderDetail detail;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1).build();
        store = Store.builder().id(10).name("Store A").owner(User.builder().id(2).build()).build();
        plant = Plant.builder().id(101).price(new BigDecimal("100000")).imageUrl("http://img.com").build();
        order = Order.builder()
                .id(999)
                .customer(customer)
                .store(store)
                .recipientName("John")
                .recipientPhone("123")
                .shippingAddress("Addr")
                .subtotal(new BigDecimal("200000"))
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("200000"))
                .paymentMethod("PAYOS")
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        detail = OrderDetail.builder()
                .id(1001)
                .plant(plant)
                .productName("Plant A")
                .quantity(2)
                .unitPrice(new BigDecimal("100000"))
                .lineTotal(new BigDecimal("200000"))
                .build();

        order.setOrderDetails(List.of(detail));
    }

    @Test
    void testCheckoutDelegatesAndPublishesEvent() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentMethod("PAYOS");

        when(checkoutPricingReservationService.executeCheckoutTransaction(1, request))
                .thenReturn(List.of(order));

        List<OrderResponse> responses = orderService.checkout(1, request);

        // Verify delegation
        verify(checkoutPricingReservationService).executeCheckoutTransaction(1, request);

        // Verify event publishing
        verify(eventPublisher).publishEvent(any(OrderStatusEvent.class));

        // Verify mapped responses
        assertEquals(1, responses.size());
        OrderResponse resp = responses.get(0);
        assertEquals(999, resp.getId());
        assertEquals(10, resp.getStoreId());
        assertEquals("Store A", resp.getStoreName());
        assertEquals(new BigDecimal("200000"), resp.getTotalAmount());
    }

    @Test
    void testCheckoutThrowsOnVNPay() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentMethod("VNPAY");

        CustomException exception = assertThrows(CustomException.class, () ->
                orderService.checkout(1, request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("VNPay hiện đã tạm ngưng"));

        verifyNoInteractions(checkoutPricingReservationService);
        verifyNoInteractions(eventPublisher);
    }
}
