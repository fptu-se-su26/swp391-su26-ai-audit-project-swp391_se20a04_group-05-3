package com.greenlife.order.service;

import com.greenlife.order.dto.CartItemResponse;
import com.greenlife.order.dto.CartResponse;
import com.greenlife.order.entity.CartItem;
import com.greenlife.order.repository.CartItemRepository;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import com.greenlife.promotion.dto.PromotionPriceRequest;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.service.PriceEngineService;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.User;
import com.greenlife.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartServicePromotionTest {

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PriceEngineService priceEngineService;

    @InjectMocks
    private CartService cartService;

    private User customer;
    private Store store;
    private Plant plant1;
    private Plant plant2;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1).build();
        store = Store.builder().id(10).name("Cửa hàng nông nghiệp").build();
        plant1 = Plant.builder()
                .id(101)
                .store(store)
                .price(new BigDecimal("100000"))
                .name("Cây Kim Tiền")
                .build();
        plant2 = Plant.builder()
                .id(102)
                .store(store)
                .price(new BigDecimal("200000"))
                .name("Cây Kim Ngân")
                .build();
    }

    @Test
    void testScenario1_NoActivePromotionReturnsBasePrices() {
        // Arrange
        CartItem item = CartItem.builder()
                .id(1)
                .customer(customer)
                .plant(plant1)
                .quantity(2)
                .build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, new BigDecimal("200000"), new BigDecimal("200000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Act
        CartResponse response = cartService.getCart(1);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        CartItemResponse itemResp = response.getItems().get(0);
        assertEquals(new BigDecimal("100000"), itemResp.getBaseUnitPrice());
        assertEquals(new BigDecimal("100000"), itemResp.getEffectiveUnitPrice());
        assertEquals(BigDecimal.ZERO, itemResp.getUnitDiscount());
        assertEquals(new BigDecimal("200000"), itemResp.getLineBaseAmount());
        assertEquals(new BigDecimal("200000"), itemResp.getLineEffectiveAmount());
        assertFalse(itemResp.getOnSale());
        assertNull(itemResp.getPromotionId());
        assertEquals(new BigDecimal("200000"), response.getSubtotal());
    }

    @Test
    void testScenario2_ActiveSaleChangesEffectiveUnitPrice() {
        // Arrange
        CartItem item = CartItem.builder()
                .id(1)
                .customer(customer)
                .plant(plant1)
                .quantity(2)
                .build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 2, new BigDecimal("100000"), new BigDecimal("80000"),
                new BigDecimal("20000"), new BigDecimal("200000"), new BigDecimal("160000"),
                new BigDecimal("40000"), BigDecimal.ZERO, new BigDecimal("20000"),
                BigDecimal.ZERO, new BigDecimal("40000"),
                true, 5, "Sale Hè", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Act
        CartResponse response = cartService.getCart(1);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        CartItemResponse itemResp = response.getItems().get(0);
        assertEquals(new BigDecimal("100000"), itemResp.getBaseUnitPrice());
        assertEquals(new BigDecimal("80000"), itemResp.getEffectiveUnitPrice());
        assertEquals(new BigDecimal("20000"), itemResp.getUnitDiscount());
        assertEquals(new BigDecimal("160000"), itemResp.getLineEffectiveAmount());
        assertTrue(itemResp.getOnSale());
        assertEquals(5, itemResp.getPromotionId());
        assertEquals("Sale Hè", itemResp.getPromotionName());
        assertEquals(new BigDecimal("160000"), response.getSubtotal());
    }

    @Test
    void testScenario3_CartSubtotalEqualsSumOfLineEffectiveAmount() {
        // Arrange
        CartItem item1 = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(1).build();
        CartItem item2 = CartItem.builder().id(2).customer(customer).plant(plant2).quantity(2).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item1, item2));

        PromotionPriceQuote quote1 = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("10000"),
                true, 5, "Sale Hè", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now()
        );
        PromotionPriceQuote quote2 = new PromotionPriceQuote(
                102, 10, 2, new BigDecimal("200000"), new BigDecimal("180000"),
                new BigDecimal("20000"), new BigDecimal("400000"), new BigDecimal("360000"),
                new BigDecimal("40000"), BigDecimal.ZERO, new BigDecimal("20000"),
                BigDecimal.ZERO, new BigDecimal("40000"),
                true, 5, "Sale Hè", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote1, quote2));

        // Act
        CartResponse response = cartService.getCart(1);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getItems().size());
        assertEquals(new BigDecimal("450000"), response.getSubtotal()); // 90000 + 360000
    }

    @Test
    @SuppressWarnings("unchecked")
    void testScenario4_QuantityIsPassedToPriceEngineService() {
        // Arrange
        CartItem item = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(5).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 5, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, new BigDecimal("500000"), new BigDecimal("500000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Act
        cartService.getCart(1);

        // Assert
        ArgumentCaptor<List<PromotionPriceRequest>> captor = ArgumentCaptor.forClass(List.class);
        verify(priceEngineService).calculatePrices(captor.capture());
        List<PromotionPriceRequest> capturedReqs = captor.getValue();
        assertEquals(1, capturedReqs.size());
        assertEquals(5, capturedReqs.get(0).quantity());
    }

    @Test
    void testScenario5_ExistingCartItemReceivesCurrentSalePriceOnNextGetCartCall() {
        // Arrange
        CartItem item = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(1).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("70000"),
                new BigDecimal("30000"), new BigDecimal("100000"), new BigDecimal("70000"),
                new BigDecimal("30000"), BigDecimal.ZERO, new BigDecimal("30000"),
                BigDecimal.ZERO, new BigDecimal("30000"),
                true, 6, "Flash Sale", PromotionFundingSource.PLATFORM_FUNDED, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Act
        CartResponse response = cartService.getCart(1);

        // Assert
        verify(cartItemRepository).findByCustomerId(1);
        assertEquals(new BigDecimal("70000"), response.getItems().get(0).getEffectiveUnitPrice());
    }

    @Test
    void testScenario6_BasePriceIsRestoredWhenPriceEngineReturnsNonSaleQuote() {
        // Arrange
        CartItem item = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(1).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        // Non-sale / empty response or null quote fallback in mapping
        when(priceEngineService.calculatePrices(anyList())).thenReturn(Collections.emptyList());

        // Act
        CartResponse response = cartService.getCart(1);

        // Assert
        CartItemResponse itemResp = response.getItems().get(0);
        assertEquals(new BigDecimal("100000"), itemResp.getEffectiveUnitPrice());
        assertFalse(itemResp.getOnSale());
        assertEquals(BigDecimal.ZERO, itemResp.getUnitDiscount());
    }

    @Test
    void testScenario7_PromotionMetadataIsMappedCorrectly() {
        // Arrange
        CartItem item = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(1).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), new BigDecimal("100000"), new BigDecimal("90000"),
                new BigDecimal("10000"), BigDecimal.ZERO, new BigDecimal("10000"),
                BigDecimal.ZERO, new BigDecimal("10000"),
                true, 12, "Giảm Giá", PromotionFundingSource.STORE_FUNDED, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Act
        CartResponse response = cartService.getCart(1);

        // Assert
        CartItemResponse itemResp = response.getItems().get(0);
        assertEquals(12, itemResp.getPromotionId());
        assertEquals("Giảm Giá", itemResp.getPromotionName());
    }

    @Test
    void testScenario8And9_CartGetNeverCallsRepositorySaveOrSaveAll() {
        // Arrange
        CartItem item = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(1).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Act
        cartService.getCart(1);

        // Assert
        verify(cartItemRepository, never()).save(any());
        verify(cartItemRepository, never()).saveAll(any());
    }

    @Test
    void testScenario10_CartGetPerformsNoPromotionReservationOrBudgetMutation() {
        // Arrange
        CartItem item = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(1).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item));

        PromotionPriceQuote quote = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote));

        // Act
        cartService.getCart(1);

        // Assert
        // We verify only read-only priceEngineService.calculatePrices is called,
        // and no database-modifying or budget reservation calls exist.
        verify(priceEngineService).calculatePrices(anyList());
        verifyNoMoreInteractions(priceEngineService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void testScenario11_MultipleCartItemsAreSentToPriceEngineServiceInOneBatchCall() {
        // Arrange
        CartItem item1 = CartItem.builder().id(1).customer(customer).plant(plant1).quantity(1).build();
        CartItem item2 = CartItem.builder().id(2).customer(customer).plant(plant2).quantity(2).build();
        when(cartItemRepository.findByCustomerId(1)).thenReturn(List.of(item1, item2));

        PromotionPriceQuote quote1 = new PromotionPriceQuote(
                101, 10, 1, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, new BigDecimal("100000"), new BigDecimal("100000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now()
        );
        PromotionPriceQuote quote2 = new PromotionPriceQuote(
                102, 10, 2, new BigDecimal("200000"), new BigDecimal("200000"),
                BigDecimal.ZERO, new BigDecimal("400000"), new BigDecimal("400000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                false, null, null, null, LocalDateTime.now()
        );
        when(priceEngineService.calculatePrices(anyList())).thenReturn(List.of(quote1, quote2));

        // Act
        cartService.getCart(1);

        // Assert
        ArgumentCaptor<List<PromotionPriceRequest>> captor = ArgumentCaptor.forClass(List.class);
        verify(priceEngineService, times(1)).calculatePrices(captor.capture());
        List<PromotionPriceRequest> capturedReqs = captor.getValue();
        assertEquals(2, capturedReqs.size());
        assertEquals(101, capturedReqs.get(0).plantId());
        assertEquals(102, capturedReqs.get(1).plantId());
    }

    @Test
    void testScenario12_EmptyCartReturnsZeroSubtotalWithoutUnnecessaryPricingQueries() {
        // Arrange
        when(cartItemRepository.findByCustomerId(1)).thenReturn(Collections.emptyList());

        // Act
        CartResponse response = cartService.getCart(1);

        // Assert
        assertNotNull(response);
        assertTrue(response.getItems().isEmpty());
        assertEquals(BigDecimal.ZERO, response.getSubtotal());
        verify(priceEngineService, never()).calculatePrices(anyList());
    }
}
