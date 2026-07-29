package com.greenlife.order.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.dto.CheckoutRequest;
import com.greenlife.order.entity.CartItem;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.OrderDetail;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.repository.CartItemRepository;
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
import com.greenlife.payment.service.PayOSWebhookProcessingService;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import com.greenlife.promotion.repository.PromotionBudgetReservationRepository;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import com.greenlife.promotion.service.PriceEngineService;
import com.greenlife.promotion.service.PromotionReservationLifecycleService;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.User;
import com.greenlife.user.repository.CustomerAddressRepository;
import com.greenlife.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SelectedCartItemPayOSIntegrationTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private PlantRepository plantRepository;
    @Mock private UserRepository userRepository;
    @Mock private CustomerAddressRepository addressRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private PromotionStoreRepository promotionStoreRepository;
    @Mock private PromotionProductRepository promotionProductRepository;
    @Mock private PromotionBudgetReservationRepository reservationRepository;
    @Mock private PriceEngineService priceEngineService;
    @Mock private Clock clock;

    @Mock private PayOSWebhookEventRepository webhookEventRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private PromotionReservationLifecycleService promotionReservationLifecycleService;

    @InjectMocks private CheckoutPricingReservationService checkoutService;
    @InjectMocks private PayOSWebhookProcessingService webhookProcessingService;

    private User customer;
    private Store storeA;
    private Store storeB;
    private Plant plantA; // 1,000 VND
    private Plant plantB; // 15,000 VND
    private CartItem cartItemA;
    private CartItem cartItemB;

    private PromotionPriceQuote createMockQuote(Integer plantId, Integer storeId, Integer quantity, BigDecimal unitPrice) {
        BigDecimal lineAmt = unitPrice.multiply(BigDecimal.valueOf(quantity));
        return new PromotionPriceQuote(
                plantId, storeId, quantity,
                unitPrice, unitPrice, BigDecimal.ZERO,
                lineAmt, lineAmt, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now()
        );
    }

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1).fullName("Customer").email("customer@test.com").build();
        storeA = Store.builder().id(10).name("Store A").owner(customer).commissionRate(new BigDecimal("0.10")).build();
        storeB = Store.builder().id(20).name("Store B").owner(customer).commissionRate(new BigDecimal("0.10")).build();

        plantA = Plant.builder().id(101).name("Product A").price(new BigDecimal("1000")).stock(100).status(PlantStatus.ACTIVE).store(storeA).build();
        plantB = Plant.builder().id(102).name("Product B").price(new BigDecimal("15000")).stock(100).status(PlantStatus.ACTIVE).store(storeA).build();

        cartItemA = CartItem.builder().id(1).customer(customer).plant(plantA).quantity(1).build();
        cartItemB = CartItem.builder().id(2).customer(customer).plant(plantB).quantity(1).build();

        lenient().when(clock.instant()).thenReturn(Instant.parse("2026-07-29T12:00:00Z"));
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));
    }

    @Test
    void testTC_CART_01_SingleItemSelectionProductB() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(2)))).thenReturn(List.of(cartItemB));
        when(plantRepository.findById(102)).thenReturn(Optional.of(plantB));

        PromotionPriceQuote quoteB = createMockQuote(102, 10, 1, new BigDecimal("15000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quoteB));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(2))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        List<Order> orders = checkoutService.executeCheckoutTransaction(1, req);

        assertEquals(1, orders.size());
        Order createdOrder = orders.get(0);
        assertEquals(new BigDecimal("15000"), createdOrder.getTotalAmount());
        assertEquals(1, createdOrder.getOrderDetails().size());
        assertEquals("Product B", createdOrder.getOrderDetails().get(0).getProductName());

        // Assert no cart items deleted during PayOS checkout
        verify(cartItemRepository, never()).deleteAll(any());
        verify(cartItemRepository, never()).deleteByCustomerIdAndPlantIdIn(any(), any());
    }

    @Test
    void testTC_CART_02_SingleItemSelectionProductA() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(1)))).thenReturn(List.of(cartItemA));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));

        PromotionPriceQuote quoteA = createMockQuote(101, 10, 1, new BigDecimal("1000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quoteA));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        List<Order> orders = checkoutService.executeCheckoutTransaction(1, req);

        assertEquals(1, orders.size());
        assertEquals(new BigDecimal("1000"), orders.get(0).getTotalAmount());

        // Assert cart item B is untouched
        verify(cartItemRepository, never()).deleteAll(any());
    }

    @Test
    void testTC_CART_03_FullCartSelectionSameStore() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(1, 2)))).thenReturn(List.of(cartItemA, cartItemB));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));
        when(plantRepository.findById(102)).thenReturn(Optional.of(plantB));

        PromotionPriceQuote quoteA = createMockQuote(101, 10, 1, new BigDecimal("1000"));
        PromotionPriceQuote quoteB = createMockQuote(102, 10, 1, new BigDecimal("15000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quoteA, quoteB));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1, 2))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        List<Order> orders = checkoutService.executeCheckoutTransaction(1, req);

        assertEquals(1, orders.size());
        assertEquals(new BigDecimal("16000"), orders.get(0).getTotalAmount());
    }

    @Test
    void testTC_CART_04_LeavePaymentPendingNoCartDeletion() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(2)))).thenReturn(List.of(cartItemB));
        when(plantRepository.findById(102)).thenReturn(Optional.of(plantB));

        PromotionPriceQuote quoteB = createMockQuote(102, 10, 1, new BigDecimal("15000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quoteB));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(2))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        checkoutService.executeCheckoutTransaction(1, req);

        // Verify cart items remain untouched while pending
        verify(cartItemRepository, never()).deleteAll(any());
        verify(cartItemRepository, never()).deleteByCustomerIdAndPlantIdIn(any(), any());
    }

    @Test
    void testTC_CART_06_UnauthorizedCartItemSelectionFails() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(1, 999)))).thenReturn(List.of(cartItemA)); // 999 missing/unauthorized

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1, 999))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> checkoutService.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void testTC_CART_07_MissingCartItemIdFails() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(888)))).thenReturn(List.of());

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(888))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> checkoutService.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void testTC_CART_08_EmptyCartItemIdsFails() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of())
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> checkoutService.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void testTC_CART_09_MultiStorePayOSSelectionRejected() {
        Plant plantMultiStore = Plant.builder().id(103).name("Plant B Store 2").price(new BigDecimal("20000")).stock(50).status(PlantStatus.ACTIVE).store(storeB).build();
        CartItem cartItemMultiStore = CartItem.builder().id(3).customer(customer).plant(plantMultiStore).quantity(1).build();

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(1, 3)))).thenReturn(List.of(cartItemA, cartItemMultiStore));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1, 3))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> checkoutService.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("chỉ hỗ trợ sản phẩm từ 1 cửa hàng"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void testTC_CART_10_WebhookIdempotencyDuplicateDelivery() {
        PayOSWebhookEvent event = PayOSWebhookEvent.builder().id(100L).processingStatus(WebhookProcessingStatus.RECEIVED).build();
        PayOSWebhookData data = new PayOSWebhookData();
        data.setOrderCode(123456L);
        data.setAmount(new BigDecimal("15000"));
        data.setCode("00");

        PayOSWebhookPayload payload = new PayOSWebhookPayload();
        payload.setSuccess(true);
        payload.setData(data);

        Order order = Order.builder().id(50).customer(customer).store(storeA).totalAmount(new BigDecimal("15000")).paymentStatus(PaymentStatus.PENDING).status(OrderStatus.PENDING).build();
        OrderDetail detail = OrderDetail.builder().order(order).plant(plantB).quantity(1).build();
        order.setOrderDetails(List.of(detail));

        PaymentTransaction tx = PaymentTransaction.builder().id(200).order(order).amount(new BigDecimal("15000")).status(PaymentTransactionStatus.PENDING).provider(PaymentProvider.PAYOS).paymentMethod(PaymentMethod.PAYOS).providerOrderCode(123456L).build();

        when(webhookEventRepository.findAndLockById(100L)).thenReturn(Optional.of(event));
        when(paymentTransactionRepository.findAndLockByProviderOrderCode(123456L)).thenReturn(Optional.of(tx));

        webhookProcessingService.processRegisteredEvent(100L, payload);

        // Verify cart deletion for plantB (id 102) occurs on first success
        verify(cartItemRepository, times(1)).deleteByCustomerIdAndPlantIdIn(1, List.of(102));

        // Duplicate delivery test
        PayOSWebhookEvent event2 = PayOSWebhookEvent.builder().id(101L).processingStatus(WebhookProcessingStatus.RECEIVED).build();
        when(webhookEventRepository.findAndLockById(101L)).thenReturn(Optional.of(event2));

        webhookProcessingService.processRegisteredEvent(101L, payload);

        // Verify no extra deletion calls
        verify(cartItemRepository, times(1)).deleteByCustomerIdAndPlantIdIn(1, List.of(102));
    }

    @Test
    void testTC_CART_11_CodCheckoutOnlyDeletesSelectedItems() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerIdAndIdIn(eq(1), eq(List.of(2)))).thenReturn(List.of(cartItemB));
        when(plantRepository.findById(102)).thenReturn(Optional.of(plantB));

        PromotionPriceQuote quoteB = createMockQuote(102, 10, 1, new BigDecimal("15000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quoteB));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(2))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        checkoutService.executeCheckoutTransaction(1, req);

        // Verify only cartItemB is deleted immediately for COD
        verify(cartItemRepository, times(1)).deleteAll(List.of(cartItemB));
    }
}
