package com.greenlife.plant.service;

import com.greenlife.plant.dto.PlantRequest;
import com.greenlife.plant.dto.PlantResponse;
import com.greenlife.plant.dto.StoreOwnerPlantRequest;
import com.greenlife.category.entity.Category;
import com.greenlife.plant.entity.Plant;
import com.greenlife.store.entity.Store;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.user.entity.User;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import com.greenlife.promotion.service.PriceEngineService;
import com.greenlife.promotion.dto.PromotionPriceRequest;
import com.greenlife.promotion.dto.PromotionPriceQuote;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PlantService {

    private final PlantRepository plantRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final com.greenlife.order.repository.OrderDetailRepository orderDetailRepository;
    private final PriceEngineService priceEngineService;

    private List<Integer> cachedBestSellerIds = null;
    private long lastCacheTime = 0;

    private synchronized List<Integer> getBestSellerPlantIds() {
        long now = System.currentTimeMillis();
        if (cachedBestSellerIds == null || (now - lastCacheTime > 60000)) {
            try {
                cachedBestSellerIds = orderDetailRepository.findTopSellingPlants().stream()
                        .limit(5)
                        .map(arr -> (Integer) arr[0])
                        .collect(Collectors.toList());
                lastCacheTime = now;
            } catch (Exception e) {
                return java.util.Collections.emptyList();
            }
        }
        return cachedBestSellerIds;
    }

    @Transactional(readOnly = true)
    public Page<PlantResponse> getActivePlants(String search, String category, Pageable pageable) {
        String categoryParam = (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all")) ? category.trim() : null;
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Plant> plantsPage = plantRepository.findActiveAndOutOfStockPlants(searchParam, categoryParam, pageable);
        List<Plant> plants = plantsPage.getContent();
        Map<Integer, PromotionPriceQuote> quotesMap = getQuotesMapForPlants(plants);
        return plantsPage.map(plant -> mapToPlantResponseWithQuote(plant, quotesMap.get(plant.getId())));
    }

    @Transactional(readOnly = true)
    public PlantResponse getPlantByIdPublic(Integer id) {
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

        if (plant.getStatus() == PlantStatus.INACTIVE) {
            throw new CustomException("Sản phẩm không hoạt động", HttpStatus.NOT_FOUND);
        }

        Map<Integer, PromotionPriceQuote> quotesMap = getQuotesMapForPlants(List.of(plant));
        return mapToPlantResponseWithQuote(plant, quotesMap.get(plant.getId()));
    }

    @Transactional(readOnly = true)
    public PlantResponse getPlantById(Integer id) {
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));
        Map<Integer, PromotionPriceQuote> quotesMap = getQuotesMapForPlants(List.of(plant));
        return mapToPlantResponseWithQuote(plant, quotesMap.get(plant.getId()));
    }

    @Transactional
    public PlantResponse createPlant(PlantRequest request) {
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.BAD_REQUEST));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new CustomException("Danh mục không tồn tại", HttpStatus.BAD_REQUEST));

        String trimmedName = request.getName().trim();
        String trimmedSlug = request.getSlug().trim();

        if (plantRepository.existsByNameIgnoreCaseAndStoreId(trimmedName, request.getStoreId())) {
            throw new CustomException("Tên sản phẩm đã tồn tại trong cửa hàng này", HttpStatus.BAD_REQUEST);
        }

        if (plantRepository.existsBySlugAndStoreId(trimmedSlug, request.getStoreId())) {
            throw new CustomException("Slug sản phẩm đã tồn tại trong cửa hàng này", HttpStatus.BAD_REQUEST);
        }

        PlantStatus initialStatus = PlantStatus.ACTIVE;
        if (request.getStatus() != null) {
            try {
                initialStatus = PlantStatus.valueOf(request.getStatus().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new CustomException("Trạng thái sản phẩm không hợp lệ", HttpStatus.BAD_REQUEST);
            }
        }

        Plant plant = Plant.builder()
                .store(store)
                .category(category)
                .name(trimmedName)
                .slug(trimmedSlug)
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .imageUrl(request.getImageUrl())
                .careLevel(request.getCareLevel())
                .sunlight(request.getSunlight())
                .waterLevel(request.getWaterLevel())
                .sku(request.getSku() != null ? request.getSku().trim() : null)
                .status(initialStatus)
                .createdAt(LocalDateTime.now())
                .build();

        Plant saved = plantRepository.save(plant);
        Map<Integer, PromotionPriceQuote> quotesMap = getQuotesMapForPlants(List.of(saved));
        return mapToPlantResponseWithQuote(saved, quotesMap.get(saved.getId()));
    }

    @Transactional
    public PlantResponse updatePlant(Integer id, PlantRequest request) {
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.BAD_REQUEST));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new CustomException("Danh mục không tồn tại", HttpStatus.BAD_REQUEST));

        String trimmedName = request.getName().trim();
        String trimmedSlug = request.getSlug().trim();

        if (!plant.getName().equalsIgnoreCase(trimmedName) &&
                plantRepository.existsByNameIgnoreCaseAndStoreId(trimmedName, request.getStoreId())) {
            throw new CustomException("Tên sản phẩm đã tồn tại trong cửa hàng này", HttpStatus.BAD_REQUEST);
        }

        if (!plant.getSlug().equalsIgnoreCase(trimmedSlug) &&
                plantRepository.existsBySlugAndStoreId(trimmedSlug, request.getStoreId())) {
            throw new CustomException("Slug sản phẩm đã tồn tại trong cửa hàng này", HttpStatus.BAD_REQUEST);
        }

        PlantStatus updatedStatus = plant.getStatus();
        if (request.getStatus() != null) {
            try {
                updatedStatus = PlantStatus.valueOf(request.getStatus().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new CustomException("Trạng thái sản phẩm không hợp lệ", HttpStatus.BAD_REQUEST);
            }
        }

        int oldStock = plant.getStock();
        PlantStatus oldStatus = plant.getStatus();

        plant.setStore(store);
        plant.setCategory(category);
        plant.setName(trimmedName);
        plant.setSlug(trimmedSlug);
        plant.setDescription(request.getDescription());
        plant.setPrice(request.getPrice());
        plant.setStock(request.getStock());
        plant.setImageUrl(request.getImageUrl());
        plant.setCareLevel(request.getCareLevel());
        plant.setSunlight(request.getSunlight());
        plant.setWaterLevel(request.getWaterLevel());
        plant.setSku(request.getSku() != null ? request.getSku().trim() : null);
        plant.setStatus(updatedStatus);
        plant.setUpdatedAt(LocalDateTime.now());

        Plant saved = plantRepository.save(plant);

        boolean isRestocked = (oldStock == 0 || oldStatus == PlantStatus.OUT_OF_STOCK)
                && saved.getStock() > 0
                && saved.getStatus() == PlantStatus.ACTIVE;

        if (isRestocked) {
            eventPublisher.publishEvent(new com.greenlife.wishlist.event.WishlistRestockEvent(this, saved.getId(), saved.getName()));
        }

        Map<Integer, PromotionPriceQuote> quotesMap = getQuotesMapForPlants(List.of(saved));
        return mapToPlantResponseWithQuote(saved, quotesMap.get(saved.getId()));
    }

    @Transactional
    public void softDeletePlant(Integer id) {
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));
        plant.setStatus(PlantStatus.INACTIVE);
        plant.setUpdatedAt(LocalDateTime.now());
        plantRepository.save(plant);
    }

    public PlantResponse mapToPlantResponse(Plant plant) {
        boolean best = getBestSellerPlantIds().contains(plant.getId());
        return PlantResponse.builder()
                .id(plant.getId())
                .storeId(plant.getStore().getId())
                .storeName(plant.getStore().getName())
                .categoryId(plant.getCategory() != null ? plant.getCategory().getId() : null)
                .categoryName(plant.getCategory() != null ? plant.getCategory().getName() : null)
                .categorySlug(plant.getCategory() != null ? plant.getCategory().getSlug() : null)
                .name(plant.getName())
                .slug(plant.getSlug())
                .description(plant.getDescription())
                .price(plant.getPrice())
                .stock(plant.getStock())
                .imageUrl(plant.getImageUrl())
                .careLevel(plant.getCareLevel())
                .sunlight(plant.getSunlight())
                .waterLevel(plant.getWaterLevel())
                .sku(plant.getSku())
                .isBestSeller(best)
                .status(plant.getStatus())
                .createdAt(plant.getCreatedAt())
                .updatedAt(plant.getUpdatedAt())
                .build();
    }

    public PlantResponse mapToPlantResponseWithQuote(Plant plant, PromotionPriceQuote quote) {
        PlantResponse resp = mapToPlantResponse(plant);
        if (quote != null) {
            resp.setEffectivePrice(quote.effectiveUnitPrice());
            resp.setDiscountAmount(quote.unitDiscount());
            resp.setOnSale(quote.onSale());
            resp.setPromotionId(quote.promotionId());
            resp.setPromotionName(quote.promotionName());
        } else {
            resp.setEffectivePrice(plant.getPrice());
            resp.setDiscountAmount(BigDecimal.ZERO);
            resp.setOnSale(false);
        }
        return resp;
    }

    private Map<Integer, PromotionPriceQuote> getQuotesMapForPlants(List<Plant> plants) {
        if (plants == null || plants.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        List<PromotionPriceRequest> requests = plants.stream()
            .map(p -> new PromotionPriceRequest(p.getId(), p.getStore().getId(), 1, p.getPrice()))
            .collect(Collectors.toList());
        List<PromotionPriceQuote> quotes = priceEngineService.calculatePrices(requests);
        return quotes.stream()
            .collect(Collectors.toMap(PromotionPriceQuote::plantId, q -> q, (q1, q2) -> q1));
    }

    @Transactional(readOnly = true)
    public List<PlantResponse> getStoreOwnerPlants(User user) {
        Store store = getApprovedStoreForUser(user);
        List<Plant> plants = plantRepository.findByStoreId(store.getId());
        Map<Integer, PromotionPriceQuote> quotesMap = getQuotesMapForPlants(plants);
        return plants.stream()
                .map(plant -> mapToPlantResponseWithQuote(plant, quotesMap.get(plant.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Converts a StoreOwnerPlantRequest into a full PlantRequest with storeId injected,
     * then delegates to the standard createPlant logic.
     */
    @Transactional
    public PlantResponse createStoreOwnerPlant(StoreOwnerPlantRequest request, User user) {
        Store store = getApprovedStoreForUser(user);
        PlantRequest adminReq = toPlantRequest(request, store.getId());

        if (adminReq.getStock() != null && adminReq.getStock() == 0) {
            adminReq.setStatus("OUT_OF_STOCK");
        } else if (adminReq.getStatus() == null || adminReq.getStatus().trim().isEmpty()) {
            adminReq.setStatus("ACTIVE");
        }

        return createPlant(adminReq);
    }

    /**
     * Converts a StoreOwnerPlantRequest into a full PlantRequest with storeId injected,
     * verifies product ownership, then delegates to the standard updatePlant logic.
     */
    @Transactional
    public PlantResponse updateStoreOwnerPlant(Integer id, StoreOwnerPlantRequest request, User user) {
        Store store = getApprovedStoreForUser(user);
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

        if (!plant.getStore().getId().equals(store.getId())) {
            throw new CustomException("Bạn không có quyền chỉnh sửa sản phẩm này", HttpStatus.FORBIDDEN);
        }

        PlantRequest adminReq = toPlantRequest(request, store.getId());
        // Preserve existing slug if request slug is blank
        if (adminReq.getSlug() == null || adminReq.getSlug().isBlank()) {
            adminReq.setSlug(plant.getSlug());
        }

        if (adminReq.getStock() != null && adminReq.getStock() == 0) {
            adminReq.setStatus("OUT_OF_STOCK");
        } else if (adminReq.getStatus() == null || adminReq.getStatus().trim().isEmpty()) {
            adminReq.setStatus("ACTIVE");
        }

        return updatePlant(id, adminReq);
    }

    /**
     * Bridges StoreOwnerPlantRequest into PlantRequest, injecting storeId and
     * auto-generating a unique slug from the product name if none is provided.
     */
    private PlantRequest toPlantRequest(StoreOwnerPlantRequest src, Integer storeId) {
        String slug = (src.getSlug() != null && !src.getSlug().isBlank())
                ? src.getSlug().trim()
                : generateSlug(src.getName()) + "-" + System.currentTimeMillis();

        return PlantRequest.builder()
                .name(src.getName())
                .slug(slug)
                .storeId(storeId)
                .categoryId(src.getCategoryId())
                .description(src.getDescription())
                .price(src.getPrice())
                .stock(src.getStock())
                .imageUrl(src.getImageUrl())
                .careLevel(src.getCareLevel())
                .sunlight(src.getSunlight())
                .waterLevel(src.getWaterLevel())
                .sku(src.getSku())
                .status(src.getStatus())
                .build();
    }

    /**
     * Creates a URL-safe ASCII slug from a Vietnamese product name.
     */
    private static String generateSlug(String name) {
        if (name == null) return "san-pham";
        String normalized = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD);
        return normalized
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("[đĐ]", "d")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }

    @Transactional
    public void deleteStoreOwnerPlant(Integer id, User user) {
        Store store = getApprovedStoreForUser(user);
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));
        
        if (!plant.getStore().getId().equals(store.getId())) {
            throw new CustomException("Bạn không có quyền xóa sản phẩm này", HttpStatus.FORBIDDEN);
        }
        
        plant.setStatus(PlantStatus.INACTIVE);
        plant.setUpdatedAt(LocalDateTime.now());
        plantRepository.save(plant);
    }

    private Store getApprovedStoreForUser(User user) {
        List<Store> stores = storeRepository.findByOwnerId(user.getId());
        return stores.stream()
                .filter(s -> s.getStatus() == StoreStatus.APPROVED)
                .findFirst()
                .orElseThrow(() -> new CustomException("Tài khoản chưa có cửa hàng được duyệt", HttpStatus.FORBIDDEN));
    }
}
