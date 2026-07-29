package com.greenlife.order.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.dto.CheckoutRequest;
import com.greenlife.order.entity.CartItem;
import com.greenlife.order.entity.Order;
import com.greenlife.order.repository.CartItemRepository;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import com.greenlife.promotion.repository.PromotionBudgetReservationRepository;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import com.greenlife.promotion.service.PriceEngineService;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SelectedCartItemCheckoutTest {

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

    @InjectMocks private CheckoutPricingReservationService service;

    private User customer;
    private Store storeA;
    private Store storeB;
    private Plant plantA;
    private Plant plantB;
    private CartItem cartItem1;
    private CartItem cartItem2;

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
        customer = User.builder().id(1).fullName("Customer 1").email("cust1@test.com").build();
        storeA = Store.builder().id(10).name("Store A").commissionRate(new BigDecimal("0.10")).build();
        storeB = Store.builder().id(20).name("Store B").commissionRate(new BigDecimal("0.10")).build();

        plantA = Plant.builder()
                .id(101)
                .name("Plant A")
                .price(new BigDecimal("100000"))
                .stock(50)
                .status(PlantStatus.ACTIVE)
                .store(storeA)
                .build();

        plantB = Plant.builder()
                .id(102)
                .name("Plant B")
                .price(new BigDecimal("200000"))
                .stock(30)
                .status(PlantStatus.ACTIVE)
                .store(storeB)
                .build();

        cartItem1 = CartItem.builder().id(1001).customer(customer).plant(plantA).quantity(2).build();
        cartItem2 = CartItem.builder().id(1002).customer(customer).plant(plantB).quantity(3).build();

        lenient().when(clock.instant()).thenReturn(Instant.parse("2026-07-29T12:00:00Z"));
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));
    }

    @Test
    void testCheckout_WithOneSelectedItem_CreatesOrderOnlyForThatItem() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1, cartItem2));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));

        PromotionPriceQuote quote = createMockQuote(101, 10, 2, new BigDecimal("100000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quote));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(999);
            return o;
        });

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1001))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        List<Order> orders = service.executeCheckoutTransaction(1, req);

        assertEquals(1, orders.size());
        Order createdOrder = orders.get(0);
        assertEquals(storeA.getId(), createdOrder.getStore().getId());
        assertEquals(1, createdOrder.getOrderDetails().size());
        assertEquals("Plant A", createdOrder.getOrderDetails().get(0).getProductName());
        assertEquals(2, createdOrder.getOrderDetails().get(0).getQuantity());
    }

    @Test
    void testCheckout_UnselectedItemsRemainInCart_AndOnlySelectedItemsDeleted() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1, cartItem2));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));

        PromotionPriceQuote quote = createMockQuote(101, 10, 2, new BigDecimal("100000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quote));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1001))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        service.executeCheckoutTransaction(1, req);

        // Verify only cartItem1 is deleted from DB, cartItem2 is preserved
        verify(cartItemRepository, times(1)).deleteAll(List.of(cartItem1));
        verify(cartItemRepository, never()).deleteAll(List.of(cartItem1, cartItem2));
    }

    @Test
    void testCheckout_SubmittedCartItemBelongingToAnotherUser_IsRejected() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1002))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> service.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("không thuộc về bạn") || ex.getMessage().contains("không tồn tại"));
    }

    @Test
    void testCheckout_NonexistentCartItemId_IsRejected() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(9999))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> service.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void testCheckout_DuplicateCartItemIds_DoNotCreateDuplicateOrderDetails() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));

        PromotionPriceQuote quote = createMockQuote(101, 10, 2, new BigDecimal("100000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quote));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1001, 1001))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        List<Order> orders = service.executeCheckoutTransaction(1, req);
        assertEquals(1, orders.size());
        assertEquals(1, orders.get(0).getOrderDetails().size());
    }

    @Test
    void testCheckout_EmptyCartItemIds_IsRejected() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of())
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> service.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("chọn ít nhất một sản phẩm"));
    }

    @Test
    void testCheckout_PayosWithSingleStore_IsAllowed() {
        Plant plantA2 = Plant.builder().id(103).name("Plant A2").price(new BigDecimal("50000")).stock(10).status(PlantStatus.ACTIVE).store(storeA).build();
        CartItem cartItem3 = CartItem.builder().id(1003).customer(customer).plant(plantA2).quantity(1).build();

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1, cartItem3));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));
        when(plantRepository.findById(103)).thenReturn(Optional.of(plantA2));

        PromotionPriceQuote quote1 = createMockQuote(101, 10, 2, new BigDecimal("100000"));
        PromotionPriceQuote quote2 = createMockQuote(103, 10, 1, new BigDecimal("50000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quote1, quote2));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1001, 1003))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        List<Order> orders = service.executeCheckoutTransaction(1, req);
        assertEquals(1, orders.size());
        assertEquals("PAYOS", orders.get(0).getPaymentMethod());
    }

    @Test
    void testCheckout_PayosWithMultipleStores_IsRejectedBeforePersistence() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1, cartItem2));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1001, 1002)) // Items from Store A and Store B
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("PAYOS")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> service.executeCheckoutTransaction(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Thanh toán PayOS hiện tại chỉ hỗ trợ sản phẩm từ 1 cửa hàng"));

        // Verify no order was saved and no stock was deducted
        verify(orderRepository, never()).save(any());
        verify(plantRepository, never()).save(any());
    }

    @Test
    void testCheckout_CodWithMultipleStores_CreatesSeparateOrdersPerStore() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1, cartItem2));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));
        when(plantRepository.findById(102)).thenReturn(Optional.of(plantB));

        PromotionPriceQuote quote1 = createMockQuote(101, 10, 2, new BigDecimal("100000"));
        PromotionPriceQuote quote2 = createMockQuote(102, 20, 3, new BigDecimal("200000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quote1, quote2));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1001, 1002))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        List<Order> orders = service.executeCheckoutTransaction(1, req);
        assertEquals(2, orders.size());
    }

    @Test
    void testCheckout_InventoryIsDeductedOnlyForSelectedItems() {
        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem1, cartItem2));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plantA));

        PromotionPriceQuote quote = createMockQuote(101, 10, 2, new BigDecimal("100000"));
        when(priceEngineService.calculatePrices(any())).thenReturn(List.of(quote));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .cartItemIds(List.of(1001))
                .recipientName("Recipient")
                .recipientPhone("0901234567")
                .shippingAddress("123 Street")
                .paymentMethod("COD")
                .build();

        service.executeCheckoutTransaction(1, req);

        // Stock of plantA (quantity 2) reduced from 50 to 48
        assertEquals(48, plantA.getStock());
        verify(plantRepository, times(1)).save(plantA);

        // Stock of plantB (unselected) remains 30
        assertEquals(30, plantB.getStock());
        verify(plantRepository, never()).save(plantB);
    }
}
