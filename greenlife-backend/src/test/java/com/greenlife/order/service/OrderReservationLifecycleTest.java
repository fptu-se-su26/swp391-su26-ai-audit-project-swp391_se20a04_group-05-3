package com.greenlife.order.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.promotion.service.PromotionReservationLifecycleService;
import com.greenlife.store.entity.Store;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderReservationLifecycleTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private PromotionReservationLifecycleService promotionReservationLifecycleService;

    @InjectMocks
    private OrderService orderService;

    private Order order;
    private Store store;
    private User customer;
    private User owner;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(200).build();
        owner = User.builder().id(300).build();
        store = Store.builder().id(50).owner(owner).build();

        order = Order.builder()
                .id(999)
                .customer(customer)
                .store(store)
                .totalAmount(new BigDecimal("100000"))
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .paymentMethod("COD")
                .build();
    }

    @Test
    void testValidCODConfirmationConsumes() {
        // Test 21: Valid COD confirmation consumes.
        when(orderRepository.findById(999)).thenReturn(Optional.of(order));
        when(storeRepository.findByOwnerId(300)).thenReturn(List.of(store));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.updateStoreOwnerOrderStatus(300, 999, "CONFIRMED");

        verify(promotionReservationLifecycleService).consumeForOrder(999);
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
    }

    @Test
    void testDuplicateCODConfirmationDoesNotDoubleConsume() {
        // Test 22: Duplicate COD confirmation does not double-consume.
        order.setStatus(OrderStatus.CONFIRMED); // already confirmed

        when(orderRepository.findById(999)).thenReturn(Optional.of(order));
        when(storeRepository.findByOwnerId(300)).thenReturn(List.of(store));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.updateStoreOwnerOrderStatus(300, 999, "CONFIRMED");

        // Should not transition again or consume because it was not PENDING
        verify(promotionReservationLifecycleService, never()).consumeForOrder(anyInt());
    }

    @Test
    void testInvalidCODTransitionDoesNotConsume() {
        // Test 23: Invalid COD transition does not consume.
        order.setStatus(OrderStatus.SHIPPING); // Cannot go from SHIPPING to CONFIRMED

        when(orderRepository.findById(999)).thenReturn(Optional.of(order));
        when(storeRepository.findByOwnerId(300)).thenReturn(List.of(store));

        assertThrows(CustomException.class, () ->
            orderService.updateStoreOwnerOrderStatus(300, 999, "CONFIRMED")
        );

        verify(promotionReservationLifecycleService, never()).consumeForOrder(anyInt());
    }

    @Test
    void testCustomerCancellationReleases() {
        // Test 24: Customer cancellation releases.
        when(orderRepository.findById(999)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.cancelCustomerOrder(200, 999);

        verify(promotionReservationLifecycleService).releaseForOrder(999, "Customer cancelled order");
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }

    @Test
    void testStoreCancellationReleases() {
        // Test 25: Store cancellation releases.
        when(orderRepository.findById(999)).thenReturn(Optional.of(order));
        when(storeRepository.findByOwnerId(300)).thenReturn(List.of(store));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.cancelStoreOwnerOrder(300, 999);

        verify(promotionReservationLifecycleService).releaseForOrder(999, "Store owner cancelled order");
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }

    @Test
    void testCancellationWithoutReservationSucceeds() {
        // Test 26: Cancellation without reservation succeeds (releaseForOrder is still called but behaves as no-op).
        when(orderRepository.findById(999)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.cancelCustomerOrder(200, 999);

        verify(promotionReservationLifecycleService).releaseForOrder(999, "Customer cancelled order");
    }

    @Test
    void testPaidCancellationDoesNotRelease() {
        // Test 27: Paid/consumed cancellation does not release (releaseForOrder is called, but is a no-op internally, tested in service test).
        order.setStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findById(999)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.cancelCustomerOrder(200, 999);

        verify(promotionReservationLifecycleService).releaseForOrder(999, "Customer cancelled order");
    }

    @Test
    void testDuplicateCancellationIsIdempotent() {
        // Test 28: Duplicate cancellation is idempotent.
        order.setStatus(OrderStatus.CANCELLED);

        when(orderRepository.findById(999)).thenReturn(Optional.of(order));

        assertThrows(CustomException.class, () ->
            orderService.cancelCustomerOrder(200, 999)
        );

        verify(promotionReservationLifecycleService, never()).releaseForOrder(anyInt(), anyString());
    }
}
