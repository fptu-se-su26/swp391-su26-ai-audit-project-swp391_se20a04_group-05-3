package com.greenlife.payment.service;

import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.PayOSWebhookEvent;
import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.payment.entity.enums.PaymentMethod;
import com.greenlife.payment.entity.enums.PaymentProvider;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.payment.entity.enums.PaymentTransactionStatus;
import com.greenlife.payment.entity.enums.WebhookProcessingStatus;
import com.greenlife.payment.payos.dto.PayOSWebhookData;
import com.greenlife.payment.payos.dto.PayOSWebhookPayload;
import com.greenlife.payment.repository.PayOSWebhookEventRepository;
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
public class PayOSWebhookProcessingServiceTest {

    @Mock
    private PayOSWebhookEventRepository webhookEventRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private PromotionReservationLifecycleService promotionReservationLifecycleService;

    @InjectMocks
    private PayOSWebhookProcessingService webhookProcessingService;

    @Mock
    private PayOSStatusReconciliationService reconciliationService;

    private PayOSWebhookEvent webhookEvent;
    private PayOSWebhookPayload payload;
    private PaymentTransaction paymentTx;
    private Order order;

    @BeforeEach
    void setUp() {
        webhookEvent = PayOSWebhookEvent.builder()
                .id(1L)
                .processingStatus(WebhookProcessingStatus.RECEIVED)
                .build();

        PayOSWebhookData data = new PayOSWebhookData();
        data.setOrderCode(123456L);
        data.setAmount(new BigDecimal("100000"));
        data.setPaymentLinkId("link123");
        data.setReference("ref123");
        data.setCode("00");

        payload = new PayOSWebhookPayload();
        payload.setSuccess(true);
        payload.setData(data);

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
    void testValidPaidWebhookConsumes() {
        // Test 13: Valid paid webhook consumes.
        when(webhookEventRepository.findAndLockById(1L)).thenReturn(Optional.of(webhookEvent));
        when(paymentTransactionRepository.findAndLockByProviderOrderCode(123456L)).thenReturn(Optional.of(paymentTx));

        webhookProcessingService.processRegisteredEvent(1L, payload);

        verify(promotionReservationLifecycleService).consumeForOrder(999);
        assertEquals(PaymentTransactionStatus.PAID, paymentTx.getStatus());
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        verify(webhookEventRepository).save(webhookEvent);
        assertEquals(WebhookProcessingStatus.PROCESSED, webhookEvent.getProcessingStatus());
    }

    @Test
    void testDuplicateWebhookDoesNotDoubleConsume() {
        // Test 14: Duplicate webhook does not double-consume.
        webhookEvent.setProcessingStatus(WebhookProcessingStatus.PROCESSED);
        when(webhookEventRepository.findAndLockById(1L)).thenReturn(Optional.of(webhookEvent));

        webhookProcessingService.processRegisteredEvent(1L, payload);

        verify(promotionReservationLifecycleService, never()).consumeForOrder(anyInt());
        verify(paymentTransactionRepository, never()).findAndLockByProviderOrderCode(anyLong());
    }

    @Test
    void testAmountMismatchDoesNotConsume() {
        // Test 15: Amount mismatch does not consume.
        payload.getData().setAmount(new BigDecimal("90000")); // mismatched

        when(webhookEventRepository.findAndLockById(1L)).thenReturn(Optional.of(webhookEvent));
        when(paymentTransactionRepository.findAndLockByProviderOrderCode(123456L)).thenReturn(Optional.of(paymentTx));

        webhookProcessingService.processRegisteredEvent(1L, payload);

        verify(promotionReservationLifecycleService, never()).consumeForOrder(anyInt());
        assertNotEquals(PaymentTransactionStatus.PAID, paymentTx.getStatus());
        assertEquals(PaymentTransactionStatus.AMOUNT_MISMATCH, paymentTx.getStatus());
    }

    @Test
    void testLinkMismatchDoesNotConsume() {
        // Test 16: Link mismatch does not consume.
        payload.getData().setPaymentLinkId("mismatched_link");

        when(webhookEventRepository.findAndLockById(1L)).thenReturn(Optional.of(webhookEvent));
        when(paymentTransactionRepository.findAndLockByProviderOrderCode(123456L)).thenReturn(Optional.of(paymentTx));

        webhookProcessingService.processRegisteredEvent(1L, payload);

        verify(promotionReservationLifecycleService, never()).consumeForOrder(anyInt());
        assertNotEquals(PaymentTransactionStatus.PAID, paymentTx.getStatus());
    }

    @Test
    void testLateTerminalPaymentDoesNotConsume() {
        // Test 17: Late terminal payment does not consume automatically (moves to REQUIRES_REVIEW).
        paymentTx.setStatus(PaymentTransactionStatus.FAILED);

        when(webhookEventRepository.findAndLockById(1L)).thenReturn(Optional.of(webhookEvent));
        when(paymentTransactionRepository.findAndLockByProviderOrderCode(123456L)).thenReturn(Optional.of(paymentTx));

        webhookProcessingService.processRegisteredEvent(1L, payload);

        verify(promotionReservationLifecycleService, never()).consumeForOrder(anyInt());
        assertEquals(PaymentTransactionStatus.REQUIRES_REVIEW, paymentTx.getStatus());
    }

    @Test
    void testLegacyOrderWithoutReservationRemainsCompatible() {
        // Test 18: Legacy order without reservation remains compatible (consumes but returns early in lifecycle).
        order.setPayosOrderCode(123456L);

        when(webhookEventRepository.findAndLockById(1L)).thenReturn(Optional.of(webhookEvent));
        // No Phase 8 payment transaction
        when(paymentTransactionRepository.findAndLockByProviderOrderCode(123456L)).thenReturn(Optional.empty());
        when(orderRepository.findAndLockByPayosOrderCode(123456L)).thenReturn(Optional.of(order));

        webhookProcessingService.processRegisteredEvent(1L, payload);

        verify(promotionReservationLifecycleService).consumeForOrder(999); // still invokes lifecycle safely
        assertEquals(PaymentStatus.PAID, order.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
    }
}
