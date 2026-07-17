package com.greenlife.promotion.service;

import com.greenlife.exception.CustomException;
import com.greenlife.plant.entity.Plant;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import com.greenlife.promotion.dto.PromotionPriceRequest;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionProduct;
import com.greenlife.promotion.entity.PromotionStore;
import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import com.greenlife.store.entity.Store;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PriceEngineServiceTest {

    private PriceEngineService priceEngineService;
    private PromotionRepository promotionRepository;
    private PromotionStoreRepository promotionStoreRepository;
    private PromotionProductRepository promotionProductRepository;
    private Clock clock;

    @BeforeEach
    void setUp() {
        promotionRepository = mock(PromotionRepository.class);
        promotionStoreRepository = mock(PromotionStoreRepository.class);
        promotionProductRepository = mock(PromotionProductRepository.class);
        clock = Clock.fixed(Instant.parse("2026-07-16T16:00:00Z"), ZoneId.of("UTC"));

        priceEngineService = new PriceEngineService(
            promotionRepository,
            promotionStoreRepository,
            promotionProductRepository,
            clock
        );
    }

    @Test
    void testCalculatePricesNoActivePromotions() {
        when(promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE))
            .thenReturn(Collections.emptyList());

        PromotionPriceRequest request = new PromotionPriceRequest(1, 1, 1, new BigDecimal("100000"));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(List.of(request));

        assertEquals(1, quotes.size());
        PromotionPriceQuote quote = quotes.get(0);
        assertFalse(quote.onSale());
        assertEquals(new BigDecimal("100000"), quote.effectiveUnitPrice());
        assertEquals(BigDecimal.ZERO, quote.unitDiscount());
        verifyNoInteractions(promotionStoreRepository, promotionProductRepository);
    }

    @Test
    void testCalculatePricesInputValidation() {
        // Base price negative should throw CustomException
        PromotionPriceRequest invalidPrice = new PromotionPriceRequest(1, 1, 1, new BigDecimal("-1000"));
        assertThrows(CustomException.class, () -> priceEngineService.calculatePrices(List.of(invalidPrice)));

        // Quantity less than 1 should throw CustomException
        PromotionPriceRequest invalidQuantity = new PromotionPriceRequest(1, 1, 0, new BigDecimal("10000"));
        assertThrows(CustomException.class, () -> priceEngineService.calculatePrices(List.of(invalidQuantity)));
    }

    @Test
    void testPriorityPrecedenceAndRounding() {
        Promotion p1 = Promotion.builder()
            .id(1)
            .name("Promo Low Priority")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.PERCENTAGE)
            .discountValue(new BigDecimal("15"))
            .priority(10)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        Promotion p2 = Promotion.builder()
            .id(2)
            .name("Promo High Priority")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("25000"))
            .priority(20)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.STORE_FUNDED)
            .platformFundingRatio(BigDecimal.ZERO)
            .storeFundingRatio(new BigDecimal("100"))
            .build();

        when(promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE))
            .thenReturn(List.of(p2, p1));
        when(promotionStoreRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());
        when(promotionProductRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());

        PromotionPriceRequest request = new PromotionPriceRequest(1, 1, 2, new BigDecimal("100000"));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(List.of(request));

        assertEquals(1, quotes.size());
        PromotionPriceQuote quote = quotes.get(0);
        assertTrue(quote.onSale());
        assertEquals(2, quote.promotionId());
        assertEquals(new BigDecimal("25000"), quote.unitDiscount());
        assertEquals(new BigDecimal("75000"), quote.effectiveUnitPrice());
        assertEquals(new BigDecimal("50000"), quote.lineDiscountAmount());
        assertEquals(new BigDecimal("200000"), quote.lineBaseAmount());
        assertEquals(new BigDecimal("150000"), quote.lineEffectiveAmount());
        assertEquals(new BigDecimal("50000"), quote.storeFundedLineDiscount());
        assertEquals(BigDecimal.ZERO, quote.platformFundedLineDiscount());
    }

    @Test
    void testScopeSpecificityPrecedence() {
        // Three active promotions with SAME priority 10:
        // Promo 1: scope GLOBAL, discount FIXED 10,000
        // Promo 2: scope STORE, discount FIXED 20,000 (mapped to store 1)
        // Promo 3: scope PRODUCT, discount FIXED 30,000 (mapped to plant 1)
        // PriceEngine must apply Promo 3 (PRODUCT specificity 3 > STORE specificity 2 > GLOBAL specificity 1)
        Promotion p1 = Promotion.builder()
            .id(1)
            .name("Global Promo")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("10000"))
            .priority(10)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        Promotion p2 = Promotion.builder()
            .id(2)
            .name("Store Promo")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.STORE)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("20000"))
            .priority(10)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        Promotion p3 = Promotion.builder()
            .id(3)
            .name("Product Promo")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.PRODUCT)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("30000"))
            .priority(10)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        // ordered by priority desc (all 10), then id asc (1, 2, 3)
        when(promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE))
            .thenReturn(List.of(p1, p2, p3));

        Store store = Store.builder().id(1).build();
        Plant plant = Plant.builder().id(1).build();

        PromotionStore ps = PromotionStore.builder()
            .promotion(p2).store(store).id(new com.greenlife.promotion.entity.PromotionStoreId(2, 1)).build();
        PromotionProduct pp = PromotionProduct.builder()
            .promotion(p3).plant(plant).id(new com.greenlife.promotion.entity.PromotionProductId(3, 1)).build();

        when(promotionStoreRepository.findAllByPromotionIdIn(any())).thenReturn(List.of(ps));
        when(promotionProductRepository.findAllByPromotionIdIn(any())).thenReturn(List.of(pp));

        PromotionPriceRequest request = new PromotionPriceRequest(1, 1, 1, new BigDecimal("100000"));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(List.of(request));

        assertEquals(1, quotes.size());
        PromotionPriceQuote quote = quotes.get(0);
        assertTrue(quote.onSale());
        assertEquals(3, quote.promotionId()); // Product scope selected
        assertEquals(new BigDecimal("30000"), quote.unitDiscount());
    }

    @Test
    void testEquivalentPromotionIdPrecedence() {
        // Two active GLOBAL promotions with same priority (10) and same scope:
        // Promo 1: id 15, discount FIXED 10,000
        // Promo 2: id 12, discount FIXED 15,000
        // PriceEngine must apply Promo 2 because id 12 < 15.
        Promotion p1 = Promotion.builder()
            .id(15)
            .name("Promo 15")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("10000"))
            .priority(10)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        Promotion p2 = Promotion.builder()
            .id(12)
            .name("Promo 12")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("15000"))
            .priority(10)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        // Mock returns sorted by priority desc, then id asc: p2 (12) then p1 (15)
        when(promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE))
            .thenReturn(List.of(p2, p1));
        when(promotionStoreRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());
        when(promotionProductRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());

        PromotionPriceRequest request = new PromotionPriceRequest(1, 1, 1, new BigDecimal("100000"));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(List.of(request));

        assertEquals(1, quotes.size());
        PromotionPriceQuote quote = quotes.get(0);
        assertTrue(quote.onSale());
        assertEquals(12, quote.promotionId());
        assertEquals(new BigDecimal("15000"), quote.unitDiscount());
    }

    @Test
    void testBudgetEligibilitySkip() {
        // Promo 1: priority 20, discount FIXED 50,000, but budget = 80,000, reserved = 0, consumed = 0 (available = 80,000)
        // Request quantity = 2, requiredBudget = 100,000. availableBudget 80,000 < 100,000. Skip.
        // Promo 2: priority 10, discount FIXED 10,000, budget = 50,000. available = 50,000.
        // requiredBudget = 20,000. available 50,000 >= 20,000. Eligible!
        Promotion p1 = Promotion.builder()
            .id(1)
            .name("Promo 1 (Insufficent budget)")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("50000"))
            .priority(20)
            .budget(new BigDecimal("80000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        Promotion p2 = Promotion.builder()
            .id(2)
            .name("Promo 2 (Sufficient budget)")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("10000"))
            .priority(10)
            .budget(new BigDecimal("50000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        when(promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE))
            .thenReturn(List.of(p1, p2));
        when(promotionStoreRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());
        when(promotionProductRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());

        PromotionPriceRequest request = new PromotionPriceRequest(1, 1, 2, new BigDecimal("100000"));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(List.of(request));

        assertEquals(1, quotes.size());
        PromotionPriceQuote quote = quotes.get(0);
        assertTrue(quote.onSale());
        assertEquals(2, quote.promotionId());
        assertEquals(new BigDecimal("10000"), quote.unitDiscount());
    }

    @Test
    void testCoFundedSplitRounding() {
        // Promo: discount 15%, platform funding 60%, store funding 40%
        // Price: 125,501. 15% discount = 125,501 * 0.15 = 18825.15 -> 18,825
        // Platform funded = 18,825 * 0.6 = 11,295
        // Store funded = 18,825 - 11,295 = 7,530
        Promotion p = Promotion.builder()
            .id(1)
            .name("Co-funded Promo")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.PERCENTAGE)
            .discountValue(new BigDecimal("15"))
            .priority(10)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.CO_FUNDED)
            .platformFundingRatio(new BigDecimal("60"))
            .storeFundingRatio(new BigDecimal("40"))
            .build();

        when(promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE))
            .thenReturn(List.of(p));
        when(promotionStoreRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());
        when(promotionProductRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());

        PromotionPriceRequest request = new PromotionPriceRequest(1, 1, 1, new BigDecimal("125501"));
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(List.of(request));

        assertEquals(1, quotes.size());
        PromotionPriceQuote quote = quotes.get(0);
        assertTrue(quote.onSale());
        assertEquals(new BigDecimal("18825"), quote.unitDiscount());
        assertEquals(new BigDecimal("11295"), quote.platformFundedUnitDiscount());
        assertEquals(new BigDecimal("7530"), quote.storeFundedUnitDiscount());
        assertEquals(new BigDecimal("18825"), quote.platformFundedUnitDiscount().add(quote.storeFundedUnitDiscount()));
    }

    @Test
    void testCumulativeBudgetAcrossMultipleCartLines() {
        // Promo: fixed 50,000 discount, budget 80,000
        Promotion p = Promotion.builder()
            .id(1)
            .name("Promo with 80k budget")
            .status(PromotionStatus.ACTIVE)
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.FIXED)
            .discountValue(new BigDecimal("50000"))
            .priority(10)
            .budget(new BigDecimal("80000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .build();

        when(promotionRepository.findByStatusOrderByPriorityDescIdAsc(PromotionStatus.ACTIVE))
            .thenReturn(List.of(p));
        when(promotionStoreRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());
        when(promotionProductRepository.findAllByPromotionIdIn(any())).thenReturn(Collections.emptyList());

        // Batch requests of 2 items, each requesting quantity = 1, base price = 100,000
        PromotionPriceRequest req1 = new PromotionPriceRequest(101, 1, 1, new BigDecimal("100000"));
        PromotionPriceRequest req2 = new PromotionPriceRequest(102, 1, 1, new BigDecimal("100000"));

        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(List.of(req1, req2));

        assertEquals(2, quotes.size());

        // First item gets the promotion
        PromotionPriceQuote quote1 = quotes.get(0);
        assertTrue(quote1.onSale());
        assertEquals(1, quote1.promotionId());
        assertEquals(new BigDecimal("50000"), quote1.unitDiscount());

        // Second item cannot get the promotion because only 30k budget remains, which is less than 50k
        PromotionPriceQuote quote2 = quotes.get(1);
        assertFalse(quote2.onSale());
        assertNull(quote2.promotionId());
        assertEquals(BigDecimal.ZERO, quote2.unitDiscount());
        assertEquals(new BigDecimal("100000"), quote2.effectiveUnitPrice());
    }
}
