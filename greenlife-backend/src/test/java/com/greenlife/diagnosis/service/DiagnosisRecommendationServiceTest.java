package com.greenlife.diagnosis.service;

import com.greenlife.booking.entity.PlantCareService;
import com.greenlife.booking.entity.enums.ServiceStatus;
import com.greenlife.booking.repository.PlantCareServiceRepository;
import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.store.entity.Store;
import com.greenlife.store.entity.enums.StoreStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DiagnosisRecommendationServiceTest {

    private PlantRepository plantRepository;
    private PlantCareServiceRepository plantCareServiceRepository;
    private DiagnosisRecommendationService service;

    @BeforeEach
    void setUp() {
        plantRepository = mock(PlantRepository.class);
        plantCareServiceRepository = mock(PlantCareServiceRepository.class);
        service = new DiagnosisRecommendationService(plantRepository, plantCareServiceRepository);
        ReflectionTestUtils.setField(service, "expertReviewConfidenceThreshold", 80.0);
    }

    @Test
    void testEscalationPriority_NonDiagnosableFirst() {
        // NON_DIAGNOSABLE_IMAGE takes highest priority
        var result = service.resolveRecommendations(
                Collections.emptyList(),
                BigDecimal.valueOf(95.0),
                Severity.LOW,
                null,
                false // diagnosable = false
        );
        assertTrue(result.isExpertReviewRecommended());
        assertEquals("NON_DIAGNOSABLE_IMAGE", result.getEscalationReason());
    }

    @Test
    void testEscalationPriority_CriticalSeveritySecond() {
        // Critical severity takes precedence over urgent warning, high severity, low confidence
        var result = service.resolveRecommendations(
                Collections.emptyList(),
                BigDecimal.valueOf(70.0), // low confidence
                Severity.CRITICAL,        // critical severity
                "Urgent Warning",         // urgent warning
                true
        );
        assertTrue(result.isExpertReviewRecommended());
        assertEquals("CRITICAL_SEVERITY", result.getEscalationReason());
    }

    @Test
    void testEscalationPriority_UrgentWarningThird() {
        var result = service.resolveRecommendations(
                Collections.emptyList(),
                BigDecimal.valueOf(70.0), // low confidence
                Severity.HIGH,            // high severity
                "Urgent Warning",         // urgent warning
                true
        );
        assertTrue(result.isExpertReviewRecommended());
        assertEquals("URGENT_WARNING", result.getEscalationReason());
    }

    @Test
    void testEscalationPriority_HighSeverityFourth() {
        var result = service.resolveRecommendations(
                Collections.emptyList(),
                BigDecimal.valueOf(70.0), // low confidence
                Severity.HIGH,            // high severity
                null,
                true
        );
        assertTrue(result.isExpertReviewRecommended());
        assertEquals("HIGH_SEVERITY", result.getEscalationReason());
    }

    @Test
    void testEscalationPriority_LowConfidenceFifth() {
        var result = service.resolveRecommendations(
                Collections.emptyList(),
                BigDecimal.valueOf(75.0), // below 80.0
                Severity.LOW,
                null,
                true
        );
        assertTrue(result.isExpertReviewRecommended());
        assertEquals("LOW_CONFIDENCE", result.getEscalationReason());
    }

    @Test
    void testEscalation_NoEscalation() {
        var result = service.resolveRecommendations(
                Collections.emptyList(),
                BigDecimal.valueOf(90.0), // above 80.0
                Severity.LOW,
                null,
                true
        );
        assertFalse(result.isExpertReviewRecommended());
        assertNull(result.getEscalationReason());
    }

    @Test
    void testProductEligibility_OnlyActiveApprovedInStock() {
        Store approvedStore = mock(Store.class);
        when(approvedStore.getStatus()).thenReturn(StoreStatus.APPROVED);

        Store pendingStore = mock(Store.class);
        when(pendingStore.getStatus()).thenReturn(StoreStatus.PENDING);

        Plant activeInStock = mock(Plant.class);
        when(activeInStock.getId()).thenReturn(1);
        when(activeInStock.getStatus()).thenReturn(PlantStatus.ACTIVE);
        when(activeInStock.getStock()).thenReturn(10);
        when(activeInStock.getStore()).thenReturn(approvedStore);

        Plant activeOutOfStock = mock(Plant.class);
        when(activeOutOfStock.getId()).thenReturn(2);
        when(activeOutOfStock.getStatus()).thenReturn(PlantStatus.ACTIVE);
        when(activeOutOfStock.getStock()).thenReturn(0);
        when(activeOutOfStock.getStore()).thenReturn(approvedStore);

        Plant inactiveInStock = mock(Plant.class);
        when(inactiveInStock.getId()).thenReturn(3);
        when(inactiveInStock.getStatus()).thenReturn(PlantStatus.OUT_OF_STOCK);
        when(inactiveInStock.getStock()).thenReturn(5);
        when(inactiveInStock.getStore()).thenReturn(approvedStore);

        Plant pendingStorePlant = mock(Plant.class);
        when(pendingStorePlant.getId()).thenReturn(4);
        when(pendingStorePlant.getStatus()).thenReturn(PlantStatus.ACTIVE);
        when(pendingStorePlant.getStock()).thenReturn(5);
        when(pendingStorePlant.getStore()).thenReturn(pendingStore);

        List<Plant> plantsList = Arrays.asList(activeInStock, activeOutOfStock, inactiveInStock, pendingStorePlant);
        when(plantRepository.findActiveAndOutOfStockPlants(anyString(), anyString(), any()))
                .thenReturn(new PageImpl<>(plantsList));

        // Let's trigger product lookup via a valid category like PEST_CONTROL
        var result = service.resolveRecommendations(
                Arrays.asList("PEST_CONTROL"),
                BigDecimal.valueOf(95.0),
                Severity.LOW,
                null,
                true
        );

        assertEquals(1, result.getRecommendedProducts().size());
        assertEquals(1, result.getRecommendedProducts().get(0).getId());
    }

    @Test
    void testServiceEligibility_OnlyActiveAndPrependExpert() {
        PlantCareService activeService = mock(PlantCareService.class);
        when(activeService.getId()).thenReturn(100);
        when(activeService.getStatus()).thenReturn(ServiceStatus.ACTIVE);
        Store approvedStore = mock(Store.class);
        when(approvedStore.getStatus()).thenReturn(StoreStatus.APPROVED);
        when(activeService.getStore()).thenReturn(approvedStore);

        when(plantCareServiceRepository.findActiveServicesWithFilters(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(Collections.singletonList(activeService)));

        // Test with LOW_CONFIDENCE escalation to trigger expert consult service prepending
        var result = service.resolveRecommendations(
                Arrays.asList("WATERING_AND_DRAINAGE"),
                BigDecimal.valueOf(50.0), // Low confidence -> escalates
                Severity.LOW,
                null,
                true
        );

        // Service list should contain expert consulting service prepended (id=100 from search "tư vấn")
        assertFalse(result.getRecommendedServices().isEmpty());
        assertEquals(100, result.getRecommendedServices().get(0).getId());
    }

    @Test
    void testUnsupportedCategory_NoGeneralAccessoryFallback() {
        var result = service.resolveRecommendations(
                Arrays.asList("GENERAL_PLANT_CARE"), // No product mapping exists for GENERAL_PLANT_CARE
                BigDecimal.valueOf(90.0),
                Severity.LOW,
                null,
                true
        );

        // Product recommendations must be empty (no fallback to phu-kien accessories)
        assertTrue(result.getRecommendedProducts().isEmpty());
    }

    @Test
    void testRepositoryFailure_IsNonFatal() {
        when(plantRepository.findActiveAndOutOfStockPlants(anyString(), anyString(), any()))
                .thenThrow(new RuntimeException("Database Timeout"));

        // Resolver must catch exception, log warning, and return empty list rather than failing the request
        assertDoesNotThrow(() -> {
            var result = service.resolveRecommendations(
                    Arrays.asList("PEST_CONTROL"),
                    BigDecimal.valueOf(90.0),
                    Severity.LOW,
                    null,
                    true
            );
            assertTrue(result.getRecommendedProducts().isEmpty());
        });
    }
}
