package com.greenlife.payment.service;

import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.payment.entity.enums.PaymentMethod;
import com.greenlife.payment.entity.enums.PaymentProvider;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.payment.entity.enums.PaymentTransactionStatus;
import com.greenlife.payment.repository.PaymentTransactionRepository;
import com.greenlife.payment.service.internal.PreparedPaymentStatusQuery;
import com.greenlife.promotion.service.PromotionReservationLifecycleService;
import com.greenlife.user.entity.User;
import com.greenlife.store.entity.Store;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PayOSStatusReconciliationServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private PromotionReservationLifecycleService promotionReservationLifecycleService;

    @InjectMocks
    private PayOSStatusReconciliationService reconciliationService;

    private PaymentTransaction paymentTx;
    private Order order;

    @BeforeEach
    void setUp() {
        User customer = User.builder().id(200).build();
        User owner = User.builder().id(300).build();
        Store store = Store.builder().id(50).owner(owner).build();

        order = Order.builder()
                .id(999)
                .customer(customer)
                .store(store)
                .totalAmount(new BigDecimal("100000"))
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .paymentMethod("PAYOS")
                .build();

        paymentTx = PaymentTransaction.builder()
                .id(500)
                .order(order)
                .provider(PaymentProvider.PAYOS)
                .paymentMethod(PaymentMethod.PAYOS)
                .providerOrderCode(123456L)
                .amount(new BigDecimal("100000"))
                .paymentLinkId("link123")
                .status(PaymentTransactionStatus.PENDING)
                .build();
    }

    @Test
    void testAuthoritativeStatusReconciliationConsumes() {
        // Test 19: Authoritative status reconciliation consumes.
        when(paymentTransactionRepository.findAndLockById(500)).thenReturn(Optional.of(paymentTx));

        PreparedPaymentStatusQuery query = new PreparedPaymentStatusQuery(
                999, // orderId
                500, // paymentTransactionId
                123456L, // providerOrderCode
                new BigDecimal("100000"), // expectedAmount
                true, // phase8Tracked
                false, // locallyPaid
                null, // legacyPaymentStatus
                "PENDING", // legacyOrderStatus
                "link123", // checkoutUrl
                null // qrCode
        );

        Map<String, Object> providerData = new HashMap<>();
        providerData.put("status", "PAID");
        providerData.put("amount", 100000);
        providerData.put("paymentLinkId", "link123");

        reconciliationService.applyProviderStatus(query, providerData);

        verify(promotionReservationLifecycleService).consumeForOrder(999);
        assertEquals(PaymentTransactionStatus.PAID, paymentTx.getStatus());
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
    }

    @Test
    void testFailedRetryablePayOSAttemptDoesNotReleaseReservation() {
        // Test 20: Failed retryable PayOS attempt does not release order reservation.
        when(paymentTransactionRepository.findAndLockById(500)).thenReturn(Optional.of(paymentTx));

        PreparedPaymentStatusQuery query = new PreparedPaymentStatusQuery(
                999, // orderId
                500, // paymentTransactionId
                123456L, // providerOrderCode
                new BigDecimal("100000"), // expectedAmount
                true, // phase8Tracked
                false, // locallyPaid
                null, // legacyPaymentStatus
                "PENDING", // legacyOrderStatus
                "link123", // checkoutUrl
                null // qrCode
        );

        Map<String, Object> providerData = new HashMap<>();
        providerData.put("status", "FAILED");
        providerData.put("amount", 100000);
        providerData.put("paymentLinkId", "link123");

        reconciliationService.applyProviderStatus(query, providerData);

        // Payment transaction becomes FAILED, but order status remains PENDING so we don't release promotions
        assertEquals(PaymentTransactionStatus.FAILED, paymentTx.getStatus());
        assertEquals(OrderStatus.PENDING, order.getStatus());
        verify(promotionReservationLifecycleService, never()).releaseForOrder(anyInt(), anyString());
    }
}
