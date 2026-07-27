package com.greenlife.diagnosis.service;

import com.greenlife.diagnosis.dto.DiagnosisResponse;
import com.greenlife.diagnosis.dto.DiagnosisResult;
import com.greenlife.diagnosis.entity.DiagnosisHistory;
import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.diagnosis.repository.DiagnosisHistoryRepository;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.common.service.FileStorageService;
import com.greenlife.auth.service.SecurityAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import com.greenlife.user.entity.User;
import com.greenlife.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.mockito.MockedStatic;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DiagnosisServiceTest {

    private DiagnosisHistoryRepository diagnosisHistoryRepository;
    private PlantRepository plantRepository;
    private FileStorageService fileStorageService;
    private PlantDiseaseClassifier plantDiseaseClassifier;
    private SecurityAuditService securityAuditService;
    private DiagnosisRecommendationService diagnosisRecommendationService;

    private DiagnosisService diagnosisService;

    @BeforeEach
    void setUp() {
        diagnosisHistoryRepository = mock(DiagnosisHistoryRepository.class);
        plantRepository = mock(PlantRepository.class);
        fileStorageService = mock(FileStorageService.class);
        plantDiseaseClassifier = mock(PlantDiseaseClassifier.class);
        securityAuditService = mock(SecurityAuditService.class);
        diagnosisRecommendationService = mock(DiagnosisRecommendationService.class);

        diagnosisService = new DiagnosisService(
                diagnosisHistoryRepository,
                plantRepository,
                fileStorageService,
                plantDiseaseClassifier,
                securityAuditService,
                diagnosisRecommendationService
        );
    }

    @Test
    void testConvertToResponse_HistoryNoRecommendations() {
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .plantName("Cây Trầu Bà")
                .diseaseName("Đốm lá")
                .confidenceScore(BigDecimal.valueOf(90.0))
                .severity(Severity.LOW)
                .recommendationCategories("[\"PEST_CONTROL\"]")
                .diagnosable(true)
                .escalationReason("LOW_CONFIDENCE")
                .build();

        // Convert with includeRecommendations = false
        DiagnosisResponse response = diagnosisService.convertToResponse(history, false);

        // Verify recommendation service was NOT called
        verifyNoInteractions(diagnosisRecommendationService);

        // Verify empty collections (not null)
        assertNotNull(response.getRecommendedProducts());
        assertTrue(response.getRecommendedProducts().isEmpty());
        assertNotNull(response.getRecommendedServices());
        assertTrue(response.getRecommendedServices().isEmpty());

        // Verify escalation reason translated
        assertEquals("Độ tin cậy chẩn đoán tự động thấp. Đề xuất đặt dịch vụ để có kết luận chính xác hơn.", response.getEscalationReason());
    }

    @Test
    void testConvertToResponse_DetailWithRecommendations() {
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .plantName("Cây Trầu Bà")
                .diseaseName("Đốm lá")
                .confidenceScore(BigDecimal.valueOf(90.0))
                .severity(Severity.LOW)
                .recommendationCategories("[\"PEST_CONTROL\"]")
                .diagnosable(true)
                .escalationReason("LOW_CONFIDENCE")
                .build();

        var mockRecResult = new DiagnosisRecommendationService.RecommendationResult(
                Collections.emptyList(),
                Collections.emptyList(),
                true,
                "LOW_CONFIDENCE"
        );

        when(diagnosisRecommendationService.resolveRecommendations(anyList(), any(), any(), any(), any()))
                .thenReturn(mockRecResult);

        // Convert with includeRecommendations = true
        DiagnosisResponse response = diagnosisService.convertToResponse(history, true);

        // Verify recommendation service was called
        verify(diagnosisRecommendationService, times(1)).resolveRecommendations(
                eq(Collections.singletonList("PEST_CONTROL")),
                eq(BigDecimal.valueOf(90.0)),
                eq(Severity.LOW),
                isNull(),
                eq(true)
        );

        assertNotNull(response.getRecommendedProducts());
        assertNotNull(response.getRecommendedServices());
    }

    @Test
    void testDisclaimerTranslation_ServerOwnedOverride() {
        String serverDisclaimer = "Kết quả được AI phân tích từ hình ảnh và chỉ mang tính tham khảo. Tình trạng thực tế có thể cần thêm thông tin hoặc kiểm tra trực tiếp. Để có kết luận và phương án xử lý chính xác hơn, người dùng nên đặt dịch vụ tư vấn với cửa hàng hoặc chuyên gia GreenLife.";
        
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .disclaimer(serverDisclaimer)
                .build();

        DiagnosisResponse response = diagnosisService.convertToResponse(history, false);
        assertEquals(serverDisclaimer, response.getDisclaimer());
    }

    @Test
    void testDeleteDiagnosisForCustomer_Success() {
        User customer = User.builder().id(10).email("customer@test.com").build();
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .customer(customer)
                .imageUrl("/uploads/diagnoses/test.jpg")
                .deleted(false)
                .build();

        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.of(history));

        diagnosisService.deleteDiagnosisForCustomer(1, customer);

        assertTrue(history.getDeleted());
        verify(diagnosisHistoryRepository, times(1)).saveAndFlush(history);
        // Note: TransactionSynchronizationManager will not have an active transaction in this simple mock environment, so it logs a warning and defers cleanup.
        verify(fileStorageService, never()).deleteFile(any());
    }

    @Test
    void testDeleteDiagnosisForCustomer_DifferentCustomerForbidden() {
        User owner = User.builder().id(10).email("owner@test.com").build();
        User other = User.builder().id(11).email("other@test.com").build();
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .customer(owner)
                .imageUrl("/uploads/diagnoses/test.jpg")
                .deleted(false)
                .build();

        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.of(history));

        CustomException exception = assertThrows(CustomException.class, () -> {
            diagnosisService.deleteDiagnosisForCustomer(1, other);
        });

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertFalse(history.getDeleted());
        verify(diagnosisHistoryRepository, never()).saveAndFlush(any());
        verify(fileStorageService, never()).deleteFile(any());
    }

    @Test
    void testDeleteDiagnosisForCustomer_NotFound() {
        User customer = User.builder().id(10).email("customer@test.com").build();
        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, () -> {
            diagnosisService.deleteDiagnosisForCustomer(1, customer);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(diagnosisHistoryRepository, never()).saveAndFlush(any());
        verify(fileStorageService, never()).deleteFile(any());
    }

    @Test
    void testDeleteDiagnosisForCustomer_Unauthorized() {
        CustomException exception = assertThrows(CustomException.class, () -> {
            diagnosisService.deleteDiagnosisForCustomer(1, null);
        });

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        verify(diagnosisHistoryRepository, never()).saveAndFlush(any());
        verify(fileStorageService, never()).deleteFile(any());
    }

    @Test
    void testDeleteDiagnosisForCustomer_NotCalledBeforeCommit_AndCalledAfterCommit() {
        User customer = User.builder().id(10).email("customer@test.com").build();
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .customer(customer)
                .imageUrl("/uploads/diagnoses/test.jpg")
                .deleted(false)
                .build();

        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.of(history));

        try (MockedStatic<TransactionSynchronizationManager> mockedSyncManager = mockStatic(TransactionSynchronizationManager.class)) {
            mockedSyncManager.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(true);
            mockedSyncManager.when(TransactionSynchronizationManager::isActualTransactionActive).thenReturn(true);

            ArgumentCaptor<TransactionSynchronization> syncCaptor = ArgumentCaptor.forClass(TransactionSynchronization.class);

            diagnosisService.deleteDiagnosisForCustomer(1, customer);

            assertTrue(history.getDeleted());
            verify(diagnosisHistoryRepository, times(1)).saveAndFlush(history);

            // Verify physical delete is not called before commit
            verify(fileStorageService, never()).deleteFile(any());

            mockedSyncManager.verify(() -> TransactionSynchronizationManager.registerSynchronization(syncCaptor.capture()));

            TransactionSynchronization synchronization = syncCaptor.getValue();
            assertNotNull(synchronization);

            // Invoke the callback representing after commit - physical deletion is executed here
            synchronization.afterCommit();
            verify(fileStorageService, times(1)).deleteFile("/uploads/diagnoses/test.jpg");
        }
    }

    @Test
    void testDeleteDiagnosisForCustomer_NoActiveTransactionDoesNotTriggerImmediateFileDeletion() {
        User customer = User.builder().id(10).email("customer@test.com").build();
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .customer(customer)
                .imageUrl("/uploads/diagnoses/test.jpg")
                .deleted(false)
                .build();

        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.of(history));

        try (MockedStatic<TransactionSynchronizationManager> mockedSyncManager = mockStatic(TransactionSynchronizationManager.class)) {
            mockedSyncManager.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(false);
            mockedSyncManager.when(TransactionSynchronizationManager::isActualTransactionActive).thenReturn(false);

            diagnosisService.deleteDiagnosisForCustomer(1, customer);

            assertTrue(history.getDeleted());
            verify(diagnosisHistoryRepository, times(1)).saveAndFlush(history);

            // No active transaction does not trigger immediate file deletion
            verify(fileStorageService, never()).deleteFile(any());
        }
    }

    @Test
    void testDeleteDiagnosisForCustomer_FileCleanupFailureDoesNotUndoSoftDelete() {
        User customer = User.builder().id(10).email("customer@test.com").build();
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .customer(customer)
                .imageUrl("/uploads/diagnoses/test.jpg")
                .deleted(false)
                .build();

        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.of(history));
        doThrow(new RuntimeException("IO error")).when(fileStorageService).deleteFile(any());

        try (MockedStatic<TransactionSynchronizationManager> mockedSyncManager = mockStatic(TransactionSynchronizationManager.class)) {
            mockedSyncManager.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(true);
            mockedSyncManager.when(TransactionSynchronizationManager::isActualTransactionActive).thenReturn(true);

            ArgumentCaptor<TransactionSynchronization> syncCaptor = ArgumentCaptor.forClass(TransactionSynchronization.class);

            assertDoesNotThrow(() -> diagnosisService.deleteDiagnosisForCustomer(1, customer));

            assertTrue(history.getDeleted());
            verify(diagnosisHistoryRepository, times(1)).saveAndFlush(history);

            mockedSyncManager.verify(() -> TransactionSynchronizationManager.registerSynchronization(syncCaptor.capture()));
            TransactionSynchronization synchronization = syncCaptor.getValue();
            
            // Invoke afterCommit - failure does not bubble up or undo soft-delete
            assertDoesNotThrow(() -> synchronization.afterCommit());
            verify(fileStorageService, times(1)).deleteFile("/uploads/diagnoses/test.jpg");
        }
    }

    @Test
    void testDeleteDiagnosisForCustomer_UnsafeStorageReferenceUrlSkipped() {
        User customer = User.builder().id(10).email("customer@test.com").build();
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .customer(customer)
                .imageUrl("https://external-url.com/image.jpg")
                .deleted(false)
                .build();

        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.of(history));

        try (MockedStatic<TransactionSynchronizationManager> mockedSyncManager = mockStatic(TransactionSynchronizationManager.class)) {
            mockedSyncManager.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(true);
            mockedSyncManager.when(TransactionSynchronizationManager::isActualTransactionActive).thenReturn(true);

            diagnosisService.deleteDiagnosisForCustomer(1, customer);

            assertTrue(history.getDeleted());
            verify(diagnosisHistoryRepository, times(1)).saveAndFlush(history);

            // Transaction synchronization should NOT be registered because it was an unsafe URL
            mockedSyncManager.verify(() -> TransactionSynchronizationManager.registerSynchronization(any()), never());
            verify(fileStorageService, never()).deleteFile(any());
        }
    }

    @Test
    void testDeleteDiagnosisForCustomer_UnsafeStorageReferenceTraversalSkipped() {
        User customer = User.builder().id(10).email("customer@test.com").build();
        DiagnosisHistory history = DiagnosisHistory.builder()
                .id(1)
                .customer(customer)
                .imageUrl("/uploads/diagnoses/../../etc/passwd")
                .deleted(false)
                .build();

        when(diagnosisHistoryRepository.findById(1)).thenReturn(Optional.of(history));

        try (MockedStatic<TransactionSynchronizationManager> mockedSyncManager = mockStatic(TransactionSynchronizationManager.class)) {
            mockedSyncManager.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(true);
            mockedSyncManager.when(TransactionSynchronizationManager::isActualTransactionActive).thenReturn(true);

            diagnosisService.deleteDiagnosisForCustomer(1, customer);

            assertTrue(history.getDeleted());
            verify(diagnosisHistoryRepository, times(1)).saveAndFlush(history);

            // Transaction synchronization should NOT be registered because it contains path traversal
            mockedSyncManager.verify(() -> TransactionSynchronizationManager.registerSynchronization(any()), never());
            verify(fileStorageService, never()).deleteFile(any());
        }
    }
}
