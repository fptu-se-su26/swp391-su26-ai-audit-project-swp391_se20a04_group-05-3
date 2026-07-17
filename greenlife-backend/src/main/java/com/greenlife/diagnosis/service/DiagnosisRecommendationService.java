package com.greenlife.diagnosis.service;

import com.greenlife.booking.dto.PlantCareServiceResponse;
import com.greenlife.booking.entity.PlantCareService;
import com.greenlife.booking.repository.PlantCareServiceRepository;
import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.plant.dto.PlantResponse;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.repository.PlantRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiagnosisRecommendationService {

    private final PlantRepository plantRepository;
    private final PlantCareServiceRepository plantCareServiceRepository;

    @Value("${greenlife.ai.expert-review-confidence-threshold:80.0}")
    private double expertReviewConfidenceThreshold;

    @PostConstruct
    public void validateThreshold() {
        if (expertReviewConfidenceThreshold < 0.0 || expertReviewConfidenceThreshold > 100.0) {
            throw new IllegalStateException("Expert review confidence threshold must be between 0.0 and 100.0");
        }
    }

    public static class RecommendationResult {
        private final List<PlantResponse> recommendedProducts;
        private final List<PlantCareServiceResponse> recommendedServices;
        private final boolean expertReviewRecommended;
        private final String escalationReason;

        public RecommendationResult(List<PlantResponse> recommendedProducts,
                                    List<PlantCareServiceResponse> recommendedServices,
                                    boolean expertReviewRecommended,
                                    String escalationReason) {
            this.recommendedProducts = recommendedProducts != null ? recommendedProducts : Collections.emptyList();
            this.recommendedServices = recommendedServices != null ? recommendedServices : Collections.emptyList();
            this.expertReviewRecommended = expertReviewRecommended;
            this.escalationReason = escalationReason;
        }

        public List<PlantResponse> getRecommendedProducts() {
            return recommendedProducts;
        }

        public List<PlantCareServiceResponse> getRecommendedServices() {
            return recommendedServices;
        }

        public boolean isExpertReviewRecommended() {
            return expertReviewRecommended;
        }

        public String getEscalationReason() {
            return escalationReason;
        }
    }

    /**
     * Resolves product and service recommendations, and evaluates escalation criteria.
     */
    public RecommendationResult resolveRecommendations(List<String> normalizedCategories,
                                                        BigDecimal confidenceScore,
                                                        Severity severity,
                                                        String urgentWarning,
                                                        Boolean diagnosable) {
        
        // 1. Evaluate deterministic escalation using cascading priority
        boolean expertReviewRecommended = false;
        String escalationReason = null;

        if (Boolean.FALSE.equals(diagnosable)) {
            expertReviewRecommended = true;
            escalationReason = "NON_DIAGNOSABLE_IMAGE";
        } else if (severity == Severity.CRITICAL) {
            expertReviewRecommended = true;
            escalationReason = "CRITICAL_SEVERITY";
        } else if (urgentWarning != null && !urgentWarning.trim().isEmpty()) {
            expertReviewRecommended = true;
            escalationReason = "URGENT_WARNING";
        } else if (severity == Severity.HIGH) {
            expertReviewRecommended = true;
            escalationReason = "HIGH_SEVERITY";
        } else if (confidenceScore != null && confidenceScore.doubleValue() < expertReviewConfidenceThreshold) {
            expertReviewRecommended = true;
            escalationReason = "LOW_CONFIDENCE";
        }

        List<PlantResponse> productsList = new ArrayList<>();
        List<PlantCareServiceResponse> servicesList = new ArrayList<>();

        if (normalizedCategories != null && !normalizedCategories.isEmpty()) {
            for (String tag : normalizedCategories) {
                // Products Category mapping
                String productKeyword = getProductKeywordForCategory(tag);
                if (productKeyword != null) {
                    try {
                        Page<Plant> plantPage = plantRepository.findActiveAndOutOfStockPlants(
                                productKeyword, "phu-kien", PageRequest.of(0, 10));
                        List<PlantResponse> mapped = plantPage.getContent().stream()
                                .filter(p -> p.getStatus() == com.greenlife.plant.entity.enums.PlantStatus.ACTIVE)
                                .filter(p -> p.getStock() > 0)
                                .filter(p -> p.getStore() != null && p.getStore().getStatus() == com.greenlife.store.entity.enums.StoreStatus.APPROVED)
                                .map(this::mapToPlantResponse)
                                .collect(Collectors.toList());
                        productsList.addAll(mapped);
                    } catch (Exception e) {
                        log.warn("Failed to query products for category {}: {}", tag, e.getMessage());
                    }
                }

                // Services mapping
                String serviceKeyword = getServiceKeywordForCategory(tag);
                if (serviceKeyword != null) {
                    try {
                        Page<PlantCareService> servicePage = plantCareServiceRepository.findActiveServicesWithFilters(
                                null, com.greenlife.booking.entity.enums.ServiceStatus.ACTIVE, null, null,
                                serviceKeyword, null, null, PageRequest.of(0, 10)
                        );
                        List<PlantCareServiceResponse> mapped = servicePage.getContent().stream()
                                .map(this::mapToServiceResponse)
                                .collect(Collectors.toList());
                        servicesList.addAll(mapped);
                    } catch (Exception e) {
                        log.warn("Failed to query services for category {}: {}", tag, e.getMessage());
                    }
                }
            }
        }

        // Prioritize expert consult services if escalation applies
        if (expertReviewRecommended) {
            try {
                Page<PlantCareService> expertPage = plantCareServiceRepository.findActiveServicesWithFilters(
                        null, com.greenlife.booking.entity.enums.ServiceStatus.ACTIVE, null, null,
                        "tư vấn", null, null, PageRequest.of(0, 5)
                );
                List<PlantCareServiceResponse> expertServices = expertPage.getContent().stream()
                        .map(this::mapToServiceResponse)
                        .collect(Collectors.toList());
                // Prepend unique expert services to the beginning
                for (int i = expertServices.size() - 1; i >= 0; i--) {
                    PlantCareServiceResponse es = expertServices.get(i);
                    if (servicesList.stream().noneMatch(s -> s.getId().equals(es.getId()))) {
                        servicesList.add(0, es);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to query expert escalation services: {}", e.getMessage());
            }
        }

        // De-duplicate and limit results to prevent N+1 scaling size issues
        List<PlantResponse> deduplicatedProducts = productsList.stream()
                .filter(distinctByKey(PlantResponse::getId))
                .limit(3)
                .collect(Collectors.toList());

        List<PlantCareServiceResponse> deduplicatedServices = servicesList.stream()
                .filter(distinctByKey(PlantCareServiceResponse::getId))
                .limit(3)
                .collect(Collectors.toList());

        return new RecommendationResult(deduplicatedProducts, deduplicatedServices, expertReviewRecommended, escalationReason);
    }

    private String getProductKeywordForCategory(String category) {
        if (category == null) return null;
        switch (category) {
            case "PEST_CONTROL":
            case "FUNGAL_DISEASE_CARE":
                return "thuốc";
            case "NUTRITION_AND_FERTILIZATION":
                return "phân";
            case "SOIL_AND_ROOT_CARE":
                return "đất";
            case "WATERING_AND_DRAINAGE":
                return "tưới";
            default:
                return null; // Bounded mappings only - no general accessory fallback
        }
    }

    private String getServiceKeywordForCategory(String category) {
        if (category == null) return null;
        switch (category) {
            case "PLANT_HEALTH_INSPECTION":
                return "kiểm tra";
            case "EXPERT_CONSULTATION":
                return "tư vấn";
            case "PEST_CONTROL":
                return "phun thuốc";
            case "FUNGAL_DISEASE_CARE":
                return "chữa bệnh";
            case "NUTRITION_AND_FERTILIZATION":
                return "bón phân";
            case "WATERING_AND_DRAINAGE":
                return "tưới nước";
            case "SOIL_AND_ROOT_CARE":
                return "thay đất";
            case "PRUNING_AND_RECOVERY":
                return "cắt tỉa";
            case "GENERAL_PLANT_CARE":
                return "chăm sóc";
            default:
                return null;
        }
    }

    private PlantResponse mapToPlantResponse(Plant plant) {
        return PlantResponse.builder()
                .id(plant.getId())
                .storeId(plant.getStore() != null ? plant.getStore().getId() : null)
                .storeName(plant.getStore() != null ? plant.getStore().getName() : null)
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

    private PlantCareServiceResponse mapToServiceResponse(PlantCareService service) {
        return PlantCareServiceResponse.builder()
                .id(service.getId())
                .storeId(service.getStore() != null ? service.getStore().getId() : null)
                .storeName(service.getStore() != null ? service.getStore().getName() : null)
                .storeCity(service.getStore() != null ? service.getStore().getCity() : null)
                .storeDistrict(service.getStore() != null ? service.getStore().getDistrict() : null)
                .storeAddress(service.getStore() != null ? service.getStore().getAddress() : null)
                .storePhone(service.getStore() != null ? service.getStore().getPhone() : null)
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .durationMinutes(service.getDurationMinutes())
                .status(service.getStatus())
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .build();
    }

    public static <T> Predicate<T> distinctByKey(Function<? super T, ?> keyExtractor) {
        Set<Object> seen = ConcurrentHashMap.newKeySet();
        return t -> seen.add(keyExtractor.apply(t));
    }
}
