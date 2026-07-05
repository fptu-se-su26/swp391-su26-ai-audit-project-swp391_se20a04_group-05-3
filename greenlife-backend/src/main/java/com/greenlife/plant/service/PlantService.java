package com.greenlife.plant.service;

import com.greenlife.plant.dto.PlantRequest;
import com.greenlife.plant.dto.PlantResponse;
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
import org.springframework.context.ApplicationEventPublisher;

@Service
@RequiredArgsConstructor
public class PlantService {

    private final PlantRepository plantRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Page<PlantResponse> getActivePlants(String search, String category, Pageable pageable) {
        String categoryParam = (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all")) ? category.trim() : null;
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Plant> plantsPage = plantRepository.findActiveAndOutOfStockPlants(searchParam, categoryParam, pageable);
        return plantsPage.map(this::mapToPlantResponse);
    }

    @Transactional(readOnly = true)
    public PlantResponse getPlantByIdPublic(Integer id) {
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

        if (plant.getStatus() == PlantStatus.INACTIVE) {
            throw new CustomException("Sản phẩm không hoạt động", HttpStatus.NOT_FOUND);
        }

        return mapToPlantResponse(plant);
    }

    @Transactional(readOnly = true)
    public PlantResponse getPlantById(Integer id) {
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));
        return mapToPlantResponse(plant);
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
                .status(initialStatus)
                .createdAt(LocalDateTime.now())
                .build();

        Plant saved = plantRepository.save(plant);
        return mapToPlantResponse(saved);
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
        plant.setStatus(updatedStatus);
        plant.setUpdatedAt(LocalDateTime.now());

        Plant saved = plantRepository.save(plant);

        boolean isRestocked = (oldStock == 0 || oldStatus == PlantStatus.OUT_OF_STOCK)
                && saved.getStock() > 0
                && saved.getStatus() == PlantStatus.ACTIVE;

        if (isRestocked) {
            eventPublisher.publishEvent(new com.greenlife.wishlist.event.WishlistRestockEvent(this, saved.getId(), saved.getName()));
        }

        return mapToPlantResponse(saved);
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
                .status(plant.getStatus())
                .createdAt(plant.getCreatedAt())
                .updatedAt(plant.getUpdatedAt())
                .build();
    }
}
