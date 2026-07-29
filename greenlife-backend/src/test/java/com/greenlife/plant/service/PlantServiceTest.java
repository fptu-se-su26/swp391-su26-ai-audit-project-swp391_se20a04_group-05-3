package com.greenlife.plant.service;

import com.greenlife.category.entity.Category;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.exception.CustomException;
import com.greenlife.order.repository.OrderDetailRepository;
import com.greenlife.plant.dto.PlantRequest;
import com.greenlife.plant.dto.PlantResponse;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.service.PriceEngineService;
import com.greenlife.store.entity.Store;
import com.greenlife.store.repository.StoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlantServiceTest {

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private OrderDetailRepository orderDetailRepository;

    @Mock
    private PriceEngineService priceEngineService;

    @InjectMocks
    private PlantService plantService;

    private Store sampleStore;
    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleStore = Store.builder().id(1).name("Test Store").build();
        sampleCategory = Category.builder().id(10).name("Cây trồng trong nhà").slug("cay-trong-nha").build();
    }

    @Test
    @DisplayName("1. Creating with same name as INACTIVE product restores existing product ID and updates fields")
    void testCreatePlant_RestoresInactiveProduct() {
        Plant inactivePlant = Plant.builder()
                .id(100)
                .store(sampleStore)
                .category(sampleCategory)
                .name("Cây đồng tiền")
                .slug("cay-dong-tien")
                .price(new BigDecimal("100000"))
                .stock(0)
                .status(PlantStatus.INACTIVE)
                .createdAt(LocalDateTime.now().minusDays(10))
                .build();

        PlantRequest request = PlantRequest.builder()
                .storeId(1)
                .categoryId(10)
                .name("Cây đồng tiền")
                .slug("cay-dong-tien-new")
                .description("Mô tả mới")
                .price(new BigDecimal("150000"))
                .stock(5)
                .imageUrl("http://example.com/new.jpg")
                .careLevel("Dễ")
                .sunlight("Trực tiếp")
                .waterLevel("Vừa")
                .sku("SKU-123")
                .build();

        when(storeRepository.findById(1)).thenReturn(Optional.of(sampleStore));
        when(categoryRepository.findById(10)).thenReturn(Optional.of(sampleCategory));
        when(plantRepository.findByNameIgnoreCaseAndStoreId("Cây đồng tiền", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.findBySlugAndStoreId("cay-dong-tien-new", 1)).thenReturn(Optional.empty());
        when(plantRepository.save(any(Plant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(priceEngineService.calculatePrices(any())).thenReturn(Collections.emptyList());

        PlantResponse response = plantService.createPlant(request);

        assertNotNull(response);
        assertEquals(100, response.getId());
        assertEquals("Cây đồng tiền", response.getName());
        assertEquals("cay-dong-tien-new", response.getSlug());
        assertEquals(PlantStatus.ACTIVE, response.getStatus());
        assertEquals(new BigDecimal("150000"), response.getPrice());
        assertEquals(5, response.getStock());

        verify(plantRepository, times(1)).save(inactivePlant);
    }

    @Test
    @DisplayName("2. Restoring INACTIVE product with stock == 0 sets status to OUT_OF_STOCK")
    void testCreatePlant_RestoresInactiveProductWithZeroStock() {
        Plant inactivePlant = Plant.builder()
                .id(101)
                .store(sampleStore)
                .category(sampleCategory)
                .name("Cây trầu bà")
                .slug("cay-trau-ba")
                .status(PlantStatus.INACTIVE)
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        PlantRequest request = PlantRequest.builder()
                .storeId(1)
                .categoryId(10)
                .name("Cây trầu bà")
                .slug("cay-trau-ba")
                .price(new BigDecimal("80000"))
                .stock(0)
                .build();

        when(storeRepository.findById(1)).thenReturn(Optional.of(sampleStore));
        when(categoryRepository.findById(10)).thenReturn(Optional.of(sampleCategory));
        when(plantRepository.findByNameIgnoreCaseAndStoreId("Cây trầu bà", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.findBySlugAndStoreId("cay-trau-ba", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.save(any(Plant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(priceEngineService.calculatePrices(any())).thenReturn(Collections.emptyList());

        PlantResponse response = plantService.createPlant(request);

        assertNotNull(response);
        assertEquals(101, response.getId());
        assertEquals(PlantStatus.OUT_OF_STOCK, response.getStatus());
    }

    @Test
    @DisplayName("3. Creating with same name as ACTIVE product throws duplicate-name error")
    void testCreatePlant_ThrowsErrorWhenActiveProductExists() {
        Plant activePlant = Plant.builder()
                .id(102)
                .store(sampleStore)
                .name("Cây kim tiền")
                .status(PlantStatus.ACTIVE)
                .build();

        PlantRequest request = PlantRequest.builder()
                .storeId(1)
                .categoryId(10)
                .name("Cây kim tiền")
                .slug("cay-kim-tien")
                .price(new BigDecimal("200000"))
                .stock(10)
                .build();

        when(storeRepository.findById(1)).thenReturn(Optional.of(sampleStore));
        when(categoryRepository.findById(10)).thenReturn(Optional.of(sampleCategory));
        when(plantRepository.findByNameIgnoreCaseAndStoreId("Cây kim tiền", 1)).thenReturn(Optional.of(activePlant));

        CustomException ex = assertThrows(CustomException.class, () -> plantService.createPlant(request));
        assertEquals("Tên sản phẩm đã tồn tại trong cửa hàng này", ex.getMessage());
        verify(plantRepository, never()).save(any());
    }

    @Test
    @DisplayName("4. Requested slug belongs to a different product throws duplicate-slug error")
    void testCreatePlant_ThrowsErrorWhenSlugBelongsToDifferentProduct() {
        Plant inactivePlant = Plant.builder()
                .id(103)
                .store(sampleStore)
                .name("Cây lưỡi hổ")
                .status(PlantStatus.INACTIVE)
                .build();

        Plant differentProduct = Plant.builder()
                .id(104)
                .store(sampleStore)
                .name("Cây lưỡi hổ vàng")
                .slug("cay-luoi-ho-conflict")
                .status(PlantStatus.ACTIVE)
                .build();

        PlantRequest request = PlantRequest.builder()
                .storeId(1)
                .categoryId(10)
                .name("Cây lưỡi hổ")
                .slug("cay-luoi-ho-conflict")
                .price(new BigDecimal("120000"))
                .stock(3)
                .build();

        when(storeRepository.findById(1)).thenReturn(Optional.of(sampleStore));
        when(categoryRepository.findById(10)).thenReturn(Optional.of(sampleCategory));
        when(plantRepository.findByNameIgnoreCaseAndStoreId("Cây lưỡi hổ", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.findBySlugAndStoreId("cay-luoi-ho-conflict", 1)).thenReturn(Optional.of(differentProduct));

        CustomException ex = assertThrows(CustomException.class, () -> plantService.createPlant(request));
        assertEquals("Slug sản phẩm đã tồn tại trong cửa hàng này", ex.getMessage());
        verify(plantRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. Requested slug belongs to same INACTIVE product succeeds in restoration")
    void testCreatePlant_SucceedsWhenSlugBelongsToSameInactiveProduct() {
        Plant inactivePlant = Plant.builder()
                .id(105)
                .store(sampleStore)
                .category(sampleCategory)
                .name("Cây sen đá")
                .slug("cay-sen-da")
                .status(PlantStatus.INACTIVE)
                .build();

        PlantRequest request = PlantRequest.builder()
                .storeId(1)
                .categoryId(10)
                .name("Cây sen đá")
                .slug("cay-sen-da")
                .price(new BigDecimal("50000"))
                .stock(20)
                .build();

        when(storeRepository.findById(1)).thenReturn(Optional.of(sampleStore));
        when(categoryRepository.findById(10)).thenReturn(Optional.of(sampleCategory));
        when(plantRepository.findByNameIgnoreCaseAndStoreId("Cây sen đá", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.findBySlugAndStoreId("cay-sen-da", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.save(any(Plant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(priceEngineService.calculatePrices(any())).thenReturn(Collections.emptyList());

        PlantResponse response = plantService.createPlant(request);

        assertNotNull(response);
        assertEquals(105, response.getId());
        assertEquals(PlantStatus.ACTIVE, response.getStatus());
        verify(plantRepository, times(1)).save(inactivePlant);
    }

    @Test
    @DisplayName("6. Submitted request status INACTIVE with stock > 0 still restores product status to ACTIVE")
    void testCreatePlant_RestoresToActiveEvenIfRequestStatusIsInactive() {
        Plant inactivePlant = Plant.builder()
                .id(106)
                .store(sampleStore)
                .category(sampleCategory)
                .name("Cây bàng Singapore")
                .slug("cay-bang-singapore")
                .status(PlantStatus.INACTIVE)
                .build();

        PlantRequest request = PlantRequest.builder()
                .storeId(1)
                .categoryId(10)
                .name("Cây bàng Singapore")
                .slug("cay-bang-singapore")
                .price(new BigDecimal("350000"))
                .stock(10)
                .status("INACTIVE")
                .build();

        when(storeRepository.findById(1)).thenReturn(Optional.of(sampleStore));
        when(categoryRepository.findById(10)).thenReturn(Optional.of(sampleCategory));
        when(plantRepository.findByNameIgnoreCaseAndStoreId("Cây bàng Singapore", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.findBySlugAndStoreId("cay-bang-singapore", 1)).thenReturn(Optional.of(inactivePlant));
        when(plantRepository.save(any(Plant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(priceEngineService.calculatePrices(any())).thenReturn(Collections.emptyList());

        PlantResponse response = plantService.createPlant(request);

        assertNotNull(response);
        assertEquals(106, response.getId());
        assertEquals(PlantStatus.ACTIVE, response.getStatus());
        verify(plantRepository, times(1)).save(inactivePlant);
    }
}
