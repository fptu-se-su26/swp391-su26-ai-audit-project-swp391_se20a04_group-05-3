package com.greenlife.order.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.dto.CheckoutRequest;
import com.greenlife.order.entity.CartItem;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.OrderDetail;
import com.greenlife.order.repository.*;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import com.greenlife.promotion.dto.PromotionPriceRequest;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionBudgetReservation;
import com.greenlife.promotion.entity.enums.PromotionBudgetReservationStatus;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.greenlife.promotion.entity.PromotionStoreId;
import com.greenlife.promotion.entity.PromotionProductId;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CheckoutPricingReservationServiceTest {

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

    private Clock clock;
    private CheckoutPricingReservationService service;

    private User customer;
    private Store store;
    private Plant plant;
    private CartItem cartItem;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-07-16T16:00:00Z"), ZoneId.of("UTC"));
        service = new CheckoutPricingReservationService(
                orderRepository,
                cartItemRepository,
                plantRepository,
                userRepository,
                addressRepository,
                promotionRepository,
                promotionStoreRepository,
                promotionProductRepository,
                reservationRepository,
                priceEngineService,
                clock
        );
        ReflectionTestUtils.setField(service, "defaultCommissionRateStr", "0.10");

        customer = User.builder().id(1).email("customer@greenlife.com").build();
        store = Store.builder().id(10).owner(User.builder().id(2).build()).commissionRate(new BigDecimal("0.12")).build();
        plant = Plant.builder()
                .id(101)
                .store(store)
                .price(new BigDecimal("100000"))
                .stock(10)
                .status(PlantStatus.ACTIVE)
                .name("Cây Kim Tiền")
                .build();

        cartItem = CartItem.builder()
                .id(1)
                .customer(customer)
                .plant(plant)
                .quantity(2)
                .build();
    }

    @Test
    void testScenario13_RecalculatesPricingIgnoringClientInputs() {
        CheckoutRequest request = new CheckoutRequest();
        request.setPaymentMethod("COD");
        request.setRecipientName("John Doe");
        request.setRecipientPhone("0987654321");
        request.setShippingAddress("123 Street");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("20000"),
                true, 5, "Promo", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );

        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));
        
        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .budget(new BigDecimal("50000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Order> orders = service.executeCheckoutTransaction(1, request);

        assertEquals(1, orders.size());
        Order order = orders.get(0);
        assertEquals(new BigDecimal("180000"), order.getTotalAmount()); // quote effective unit price (90k) * qty (2) = 180k
        assertEquals(new BigDecimal("180000"), order.getSubtotal());

        OrderDetail detail = order.getOrderDetails().get(0);
        assertEquals(new BigDecimal("100000"), detail.getBaseUnitPrice());
        assertEquals(new BigDecimal("90000"), detail.getFinalCustomerPrice());
        assertEquals(new BigDecimal("90000"), detail.getUnitPrice());
        assertEquals(new BigDecimal("180000"), detail.getLineTotal());
    }

    @Test
    void testScenario14_ThrowsExceptionWhenProductInactive() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        plant.setStatus(PlantStatus.INACTIVE);

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        CustomException exception = assertThrows(CustomException.class, () ->
                service.executeCheckoutTransaction(1, request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("không hoạt động"));
    }

    @Test
    void testScenario15_ThrowsExceptionWhenStockInsufficient() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        plant.setStock(1); // request wants 2

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        CustomException exception = assertThrows(CustomException.class, () ->
                service.executeCheckoutTransaction(1, request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("không đủ tồn kho khả dụng"));
    }

    @Test
    void testScenario16_SortsAndPessimisticallyLocksPromotionIdsAscending() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        CartItem item1 = CartItem.builder().id(1).customer(customer).plant(plant).quantity(1).build();
        Plant plant2 = Plant.builder().id(102).store(store).price(new BigDecimal("200000")).stock(5).status(PlantStatus.ACTIVE).name("P2").build();
        CartItem item2 = CartItem.builder().id(2).customer(customer).plant(plant2).quantity(1).build();

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item1, item2));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));
        when(plantRepository.findById(102)).thenReturn(Optional.of(plant2));

        PromotionPriceQuote quote1 = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("10000"),
                true, 15, "Promo15", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );
        PromotionPriceQuote quote2 = new PromotionPriceQuote(
                102, 10, 1, new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), BigDecimal.ZERO, new BigDecimal("20000"),
                BigDecimal.ZERO, new BigDecimal("20000"),
                true, 8, "Promo8", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );

        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote1, quote2));

        Promotion promo8 = Promotion.builder().id(8).status(PromotionStatus.ACTIVE).budget(new BigDecimal("50000")).build();
        Promotion promo15 = Promotion.builder().id(15).status(PromotionStatus.ACTIVE).budget(new BigDecimal("50000")).build();

        // Mock findAndLockById returning them
        when(promotionRepository.findAndLockById(8)).thenReturn(Optional.of(promo8));
        when(promotionRepository.findAndLockById(15)).thenReturn(Optional.of(promo15));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.executeCheckoutTransaction(1, request);

        // Verify order of locking (ID 8 locked before ID 15)
        InOrder inOrder = inOrder(promotionRepository);
        inOrder.verify(promotionRepository).findAndLockById(8);
        inOrder.verify(promotionRepository).findAndLockById(15);
    }

    @Test
    void testScenario17_ThrowsExceptionWhenLockedPromotionNotActive() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("20000"),
                true, 5, "Promo", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        Promotion promo = Promotion.builder().id(5).status(PromotionStatus.ENDED).budget(new BigDecimal("50000")).build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));

        CustomException exception = assertThrows(CustomException.class, () ->
                service.executeCheckoutTransaction(1, request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertTrue(exception.getMessage().contains("Khuyến mãi không còn hoạt động"));
    }

    @Test
    void testScenario18_ThrowsExceptionWhenBudgetInsufficient() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("20000"),
                true, 5, "Promo", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Budget is 15000, but required is 20000 (unitDiscount 10000 * qty 2)
        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .budget(new BigDecimal("15000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));

        CustomException exception = assertThrows(CustomException.class, () ->
                service.executeCheckoutTransaction(1, request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertTrue(exception.getMessage().contains("Khuyến mãi đã hết ngân sách khả dụng"));
    }

    @Test
    void testScenario19_ThrowsExceptionWhenStoreMappingMissing() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("20000"),
                true, 5, "Promo", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .scopeType(PromotionScopeType.STORE)
                .budget(new BigDecimal("50000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(promotionStoreRepository.existsById(new PromotionStoreId(5, 10))).thenReturn(false);

        CustomException exception = assertThrows(CustomException.class, () ->
                service.executeCheckoutTransaction(1, request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertTrue(exception.getMessage().contains("Cửa hàng không còn được áp dụng khuyến mãi này"));
    }

    @Test
    void testScenario20_ThrowsExceptionWhenProductMappingMissing() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("20000"),
                true, 5, "Promo", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .scopeType(PromotionScopeType.PRODUCT)
                .budget(new BigDecimal("50000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(promotionProductRepository.existsById(new PromotionProductId(5, 101))).thenReturn(false);

        CustomException exception = assertThrows(CustomException.class, () ->
                service.executeCheckoutTransaction(1, request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertTrue(exception.getMessage().contains("Sản phẩm không còn được áp dụng khuyến mãi này"));
    }

    @Test
    void testScenario21_OrderSubtotalAndTotalAmountFormulas() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("95000"),
                new BigDecimal("5000"), new BigDecimal("200000"), new BigDecimal("190000"),
                new BigDecimal("10000"), BigDecimal.ZERO, new BigDecimal("5000"),
                BigDecimal.ZERO, new BigDecimal("10000"),
                true, 5, "Promo", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .budget(new BigDecimal("50000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Order> orders = service.executeCheckoutTransaction(1, request);

        assertEquals(1, orders.size());
        Order order = orders.get(0);
        assertEquals(new BigDecimal("190000"), order.getSubtotal());
        assertEquals(new BigDecimal("190000"), order.getTotalAmount());
    }

    @Test
    void testScenario22And23_OrderDetailSnapshotsAndInvariants() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("85000"),
                new BigDecimal("15000"), new BigDecimal("200000"), new BigDecimal("170000"),
                new BigDecimal("30000"), new BigDecimal("5000"), new BigDecimal("10000"),
                new BigDecimal("10000"), new BigDecimal("20000"),
                true, 5, "Promo", PromotionFundingSource.CO_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .budget(new BigDecimal("50000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Order> orders = service.executeCheckoutTransaction(1, request);

        OrderDetail detail = orders.get(0).getOrderDetails().get(0);
        assertEquals(new BigDecimal("100000"), detail.getBaseUnitPrice());
        assertEquals(new BigDecimal("5000"), detail.getStoreFundedDiscount());
        assertEquals(new BigDecimal("10000"), detail.getPlatformFundedDiscount());
        assertEquals(new BigDecimal("85000"), detail.getFinalCustomerPrice());
        assertEquals(5, detail.getPromotion().getId());
        assertEquals(PromotionFundingSource.CO_FUNDED, detail.getPromotionFundingSource());

        // Invariant check: finalCustomerPrice (85000) + storeDiscount (5000) + platformDiscount (10000) = baseUnitPrice (100000)
        assertEquals(detail.getBaseUnitPrice(), detail.getFinalCustomerPrice().add(detail.getStoreFundedDiscount()).add(detail.getPlatformFundedDiscount()));
    }

    @Test
    void testScenario24And25_CommissionSnapshotsAndInvariants() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        // Store funded discount is 5000 per unit, total quantity 2.
        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("85000"),
                new BigDecimal("15000"), new BigDecimal("200000"), new BigDecimal("170000"),
                new BigDecimal("30000"), new BigDecimal("5000"), new BigDecimal("10000"),
                new BigDecimal("10000"), new BigDecimal("20000"),
                true, 5, "Promo", PromotionFundingSource.CO_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .budget(new BigDecimal("50000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Order> orders = service.executeCheckoutTransaction(1, request);

        OrderDetail detail = orders.get(0).getOrderDetails().get(0);
        // store.commissionRate is 0.12 (12%)
        assertEquals(new BigDecimal("0.12"), detail.getCommissionRate());

        // lineBaseAmount = 100k000 * 2 = 200k000
        // lineStoreDiscount = 5k000 * 2 = 10k000
        // commissionBase = lineBaseAmount - lineStoreDiscount = 200k000 - 10k000 = 190k000
        assertEquals(new BigDecimal("190000"), detail.getCommissionBase());

        // commissionAmount = 190k000 * 0.12 = 22k800
        assertEquals(new BigDecimal("22800"), detail.getCommissionAmount());

        // storeNetAmount = commissionBase - commissionAmount = 190k000 - 22k800 = 167k200
        assertEquals(new BigDecimal("167200"), detail.getStoreNetAmount());

        // Invariant: commissionAmount (22800) + storeNetAmount (167200) = commissionBase (190000)
        assertEquals(detail.getCommissionBase(), detail.getCommissionAmount().add(detail.getStoreNetAmount()));
    }

    @Test
    void testScenario26_PlatformFundedDiscountsDoNotReduceCommissionBase() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        // Platform funded discount is 15000, store funded discount is 0.
        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("85000"),
                new BigDecimal("15000"), new BigDecimal("200000"), new BigDecimal("170000"),
                new BigDecimal("30000"), BigDecimal.ZERO, new BigDecimal("15000"),
                BigDecimal.ZERO, new BigDecimal("30000"),
                true, 5, "Promo", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .budget(new BigDecimal("50000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Order> orders = service.executeCheckoutTransaction(1, request);

        OrderDetail detail = orders.get(0).getOrderDetails().get(0);
        // commissionBase = lineBaseAmount (200000) - lineStoreDiscount (0) = 200000 (platform discount of 30k does NOT reduce base)
        assertEquals(new BigDecimal("200000"), detail.getCommissionBase());
        assertEquals(new BigDecimal("24000"), detail.getCommissionAmount()); // 200000 * 0.12 = 24000
    }

    @Test
    void testScenario27And28And29_CreatesAggregateBudgetReservationAndUpdatesBudget() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        // Order has two lines using the same promotion
        CartItem item1 = CartItem.builder().id(1).customer(customer).plant(plant).quantity(1).build();
        Plant plant2 = Plant.builder().id(102).store(store).price(new BigDecimal("200000")).stock(5).status(PlantStatus.ACTIVE).name("P2").build();
        CartItem item2 = CartItem.builder().id(2).customer(customer).plant(plant2).quantity(1).build();

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item1, item2));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));
        when(plantRepository.findById(102)).thenReturn(Optional.of(plant2));

        // Item 1: 10k discount co-funded (3k store, 7k platform)
        PromotionPriceQuote quote1 = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("3000"), new BigDecimal("7000"),
                new BigDecimal("3000"), new BigDecimal("7000"),
                true, 5, "Promo", PromotionFundingSource.CO_FUNDED, LocalDateTime.now(clock)
        );
        // Item 2: 20k discount co-funded (6k store, 14k platform)
        PromotionPriceQuote quote2 = new PromotionPriceQuote(
                102, 10, 1, new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), new BigDecimal("6000"), new BigDecimal("14000"),
                new BigDecimal("6000"), new BigDecimal("14000"),
                true, 5, "Promo", PromotionFundingSource.CO_FUNDED, LocalDateTime.now(clock)
        );

        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote1, quote2));

        Promotion promo = Promotion.builder()
                .id(5)
                .status(PromotionStatus.ACTIVE)
                .budget(new BigDecimal("100000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .build();
        when(promotionRepository.findAndLockById(5)).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            ReflectionTestUtils.setField(order, "id", 999); // Mock saved ID
            return order;
        });

        service.executeCheckoutTransaction(1, request);

        // Verify budget reservation is saved
        verify(reservationRepository, times(1)).save(any(PromotionBudgetReservation.class));

        // Capture saved reservation
        ArgumentCaptor<PromotionBudgetReservation> resCaptor = ArgumentCaptor.forClass(PromotionBudgetReservation.class);
        verify(reservationRepository).save(resCaptor.capture());
        PromotionBudgetReservation reservation = resCaptor.getValue();

        assertEquals(999, reservation.getOrder().getId());
        assertEquals(5, reservation.getPromotion().getId());
        assertEquals("PROMOTION:5:ORDER:999", reservation.getReservationKey());
        assertEquals(new BigDecimal("30000"), reservation.getTotalDiscountAmount()); // 10k + 20k = 30k
        assertEquals(new BigDecimal("21000"), reservation.getPlatformFundedAmount()); // 7k + 14k = 21k
        assertEquals(new BigDecimal("9000"), reservation.getStoreFundedAmount()); // 3k + 6k = 9k
        assertEquals(PromotionBudgetReservationStatus.RESERVED, reservation.getStatus());

        // Verify promotion's reserved budget is incremented by 30000
        assertEquals(new BigDecimal("30000"), promo.getReservedBudget());
    }

    @Test
    void testScenario30_NonPromotionalLinesDoNotCreateReservations() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        // Quote has onSale = false and promotionId = null
        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, new BigDecimal("200000"), new BigDecimal("200000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.executeCheckoutTransaction(1, request);

        // No findAndLockById called because no promos used
        verify(promotionRepository, never()).findAndLockById(anyInt());
        // No reservations saved
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testScenario31_SuccessfulCheckoutDeletesCartItems() {
        CheckoutRequest request = new CheckoutRequest();
        request.setRecipientName("John");
        request.setRecipientPhone("0987");
        request.setShippingAddress("123");

        when(userRepository.findById(1)).thenReturn(Optional.of(customer));
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(cartItem));
        when(plantRepository.findById(101)).thenReturn(Optional.of(plant));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, new BigDecimal("200000"), new BigDecimal("200000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now(clock)
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.executeCheckoutTransaction(1, request);

        // Verify cart cleaned up
        verify(cartItemRepository).deleteAll(anyList());
    }
}
