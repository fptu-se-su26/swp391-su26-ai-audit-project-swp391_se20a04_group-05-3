package com.greenlife.diagnosis.service;

import com.greenlife.common.service.FileStorageService;
import com.greenlife.diagnosis.dto.DiagnosisResponse;
import com.greenlife.diagnosis.dto.DiagnosisResult;
import com.greenlife.diagnosis.entity.DiagnosisHistory;
import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.diagnosis.repository.DiagnosisHistoryRepository;
import com.greenlife.diagnosis.repository.specification.DiagnosisHistorySpecifications;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.enums.SecurityAuditAction;
import com.greenlife.auth.service.SecurityAuditService;
import com.greenlife.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
public class DiagnosisService {

    private final DiagnosisHistoryRepository diagnosisHistoryRepository;
    private final PlantRepository plantRepository;
    private final FileStorageService fileStorageService;
    private final PlantDiseaseClassifier plantDiseaseClassifier;
    private final SecurityAuditService securityAuditService;
    private final DiagnosisRecommendationService diagnosisRecommendationService;

    @Value("${greenlife.ai.gemini-model:}")
    private String model;


    @Transactional
    public DiagnosisHistory createDiagnosis(User customer, MultipartFile file, Integer plantId) {
        if (customer == null) {
            throw new CustomException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        // 1. Daily rate-limiting check (maximum 20 requests per calendar day)
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long dailyCount = diagnosisHistoryRepository.countByCustomerIdAndCreatedAtAfter(customer.getId(), startOfDay);
        if (dailyCount >= 20) {
            throw new CustomException("Vượt quá giới hạn chẩn đoán 20 lượt/ngày", HttpStatus.TOO_MANY_REQUESTS);
        }

        // 2. Storage quota validation (maximum 200 total images per user)
        long totalCount = diagnosisHistoryRepository.countByCustomerId(customer.getId());
        if (totalCount >= 200) {
            throw new CustomException("Hạn mức lưu trữ ảnh chẩn đoán của bạn đã đầy (tối đa 200 ảnh)", HttpStatus.BAD_REQUEST);
        }

        // 3. Validate optional plantId exists
        Plant plant = null;
        if (plantId != null) {
            plant = plantRepository.findById(plantId)
                    .orElseThrow(() -> new CustomException("Không tìm thấy cây cảnh yêu cầu", HttpStatus.BAD_REQUEST));
        }

        String relativeUrl = null;
        try {
            // 4. Save image to disk
            relativeUrl = fileStorageService.storeDiagnosisImage(file);

            // 5. Classify image using original filename and bytes
            DiagnosisResult result = plantDiseaseClassifier.classify(file.getOriginalFilename(), file.getBytes());

            // Override with mandatory server disclaimer
            String serverDisclaimer = "Kết quả được AI phân tích từ hình ảnh và chỉ mang tính tham khảo. Tình trạng thực tế có thể cần thêm thông tin hoặc kiểm tra trực tiếp. Để có kết luận và phương án xử lý chính xác hơn, người dùng nên đặt dịch vụ tư vấn với cửa hàng hoặc chuyên gia GreenLife.";
            result.setDisclaimer(serverDisclaimer);

            // Resolve recommendations, expert review status, and escalation reason
            var recommendationResult = diagnosisRecommendationService.resolveRecommendations(
                    result.getRecommendationCategories(),
                    result.getConfidenceScore(),
                    result.getSeverity(),
                    result.getUrgentWarning(),
                    result.getDiagnosable()
            );

            // 6. Build entity
            DiagnosisHistory history = DiagnosisHistory.builder()
                    .customer(customer)
                    .plant(plant)
                    .imageUrl(relativeUrl)
                    .diseaseName(result.getDiseaseName())
                    .confidenceScore(result.getConfidenceScore())
                    .severity(result.getSeverity())
                    .result(result.getResult())
                    .recommendation(result.getRecommendation())
                    .plantName(result.getPlantName())
                    .provider("GEMINI")
                    .model(model != null && !model.isBlank() ? model : "GEMINI")
                    .processingStatus("COMPLETED")
                    .observedSymptoms(result.getObservedSymptoms())
                    .possibleCauses(result.getPossibleCauses())
                    .alternativeDiagnoses(serializeList(result.getAlternativeDiagnoses()))
                    .treatmentSteps(serializeList(result.getTreatmentSteps()))
                    .preventionSteps(serializeList(result.getPreventionSteps()))
                    .urgentWarning(result.getUrgentWarning())
                    .disclaimer(result.getDisclaimer())
                    .diagnosable(result.getDiagnosable() != null ? result.getDiagnosable() : true)
                    .uncertaintyReason(result.getUncertaintyReason())
                    .expertReviewRecommended(recommendationResult.isExpertReviewRecommended())
                    .escalationReason(recommendationResult.getEscalationReason())
                    .recommendationCategories(serializeList(result.getRecommendationCategories()))
                    .deleted(false)
                    .build();

            // 7. Persist to DB and flush immediately to catch constraint/database errors
            return diagnosisHistoryRepository.saveAndFlush(history);

        } catch (Exception e) {
            // 8. DB/Persist fails -> Delete newly uploaded file immediately
            if (relativeUrl != null) {
                fileStorageService.deleteFile(relativeUrl);
            }
            if (e instanceof CustomException) {
                throw (CustomException) e;
            }
            throw new CustomException("Lỗi lưu trữ thông tin chẩn đoán: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public Page<DiagnosisHistory> getCustomerDiagnoses(Integer customerId, Integer plantId, Severity severity, Pageable pageable) {
        // Enforce pagination cap: max size 100
        int size = Math.min(pageable.getPageSize(), 100);
        Pageable cappedPageable = PageRequest.of(
                pageable.getPageNumber(),
                size,
                pageable.getSort().isEmpty() ? Sort.by(Sort.Direction.DESC, "createdAt") : pageable.getSort()
        );
        Specification<DiagnosisHistory> spec = Specification.allOf(
                DiagnosisHistorySpecifications.hasCustomer(customerId),
                DiagnosisHistorySpecifications.hasPlant(plantId),
                DiagnosisHistorySpecifications.hasSeverity(severity)
        );

        return diagnosisHistoryRepository.findAll(spec, cappedPageable);
    }

    @Transactional(readOnly = true)
    public DiagnosisHistory getDiagnosisDetails(Integer id, User user) {
        DiagnosisHistory diagnosis = diagnosisHistoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy lịch sử chẩn đoán", HttpStatus.NOT_FOUND));

        // Enforce IDOR protection: only owner or ADMIN can retrieve details
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !diagnosis.getCustomer().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền xem chi tiết chẩn đoán này", HttpStatus.FORBIDDEN);
        }

        return diagnosis;
    }

    @Transactional
    public void purgeDiagnosis(Integer id, User admin) {
        // Find record (including already soft-deleted to support force re-purges)
        DiagnosisHistory diagnosis = diagnosisHistoryRepository.findIncludingDeleted(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy lịch sử chẩn đoán", HttpStatus.NOT_FOUND));

        // Mark soft-deleted
        diagnosis.setDeleted(true);
        diagnosisHistoryRepository.saveAndFlush(diagnosis);

        // Delete physical file after transaction commits successfully
        String imageUrl = diagnosis.getImageUrl();
        if (imageUrl != null) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    fileStorageService.deleteFile(imageUrl);
                }
            });
        }

        // Record security audit
        securityAuditService.recordSecurityAudit(
                admin,
                SecurityAuditAction.ADMIN_ACTION,
                "Admin " + admin.getEmail() + " purged diagnosis " + id + " belonging to customer " + diagnosis.getCustomer().getEmail()
        );
    }

    @Transactional
    public void deleteDiagnosisForCustomer(Integer id, User customer) {
        if (customer == null) {
            throw new CustomException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        DiagnosisHistory diagnosis = diagnosisHistoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy lịch sử chẩn đoán", HttpStatus.NOT_FOUND));

        // Enforce ownership: only the owner customer can delete their own diagnosis
        if (!diagnosis.getCustomer().getId().equals(customer.getId())) {
            throw new CustomException("Bạn không có quyền xóa chẩn đoán này", HttpStatus.FORBIDDEN);
        }

        // Soft-delete the diagnosis
        diagnosis.setDeleted(true);
        diagnosisHistoryRepository.saveAndFlush(diagnosis);

        // Delete physical file after transaction commits successfully
        String imageUrl = diagnosis.getImageUrl();
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            String cleanUrl = imageUrl.trim();
            // Validate that the image URL is a valid relative path under uploads, not an external URL or absolute path, and does not contain path traversal elements.
            if ((cleanUrl.startsWith("/uploads/") || cleanUrl.startsWith("uploads/"))
                    && !cleanUrl.contains("..")
                    && !cleanUrl.startsWith("http://")
                    && !cleanUrl.startsWith("https://")) {

                if (TransactionSynchronizationManager.isSynchronizationActive() &&
                        TransactionSynchronizationManager.isActualTransactionActive()) {

                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            try {
                                fileStorageService.deleteFile(cleanUrl);
                            } catch (Exception ex) {
                                // Log a safe warning and do not expose filesystem details
                                org.slf4j.LoggerFactory.getLogger(DiagnosisService.class)
                                        .warn("Safe physical file cleanup failed: {}", ex.getMessage());
                            }
                        }
                    });
                } else {
                    org.slf4j.LoggerFactory.getLogger(DiagnosisService.class)
                            .warn("Transaction synchronization not active. Physical file cleanup deferred.");
                }
            } else {
                org.slf4j.LoggerFactory.getLogger(DiagnosisService.class)
                        .warn("Image URL is not a safe, managed relative path. Skipping physical deletion.");
            }
        }
    }

    private String serializeList(java.util.List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private java.util.List<String> deserializeList(String str) {
        if (str == null || str.isBlank()) {
            return java.util.Collections.emptyList();
        }
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                str,
                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {}
            );
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    public String translateEscalationReason(String code) {
        if (code == null) return null;
        switch (code) {
            case "NON_DIAGNOSABLE_IMAGE":
                return "Hình ảnh không chứa cây cảnh hoặc chất lượng ảnh quá kém. Khuyến nghị đặt lịch chuyên gia kiểm tra trực tiếp.";
            case "CRITICAL_SEVERITY":
                return "Tình trạng bệnh cực kỳ nghiêm trọng. Đề xuất đặt lịch chuyên gia GreenLife hỗ trợ gấp.";
            case "URGENT_WARNING":
                return "Bệnh có nguy cơ lây lan nhanh hoặc làm chết cây. Đề xuất chuyên gia kiểm tra trực tiếp.";
            case "HIGH_SEVERITY":
                return "Mức độ bệnh hại cao. Đề xuất đặt dịch vụ chăm sóc và xử lý chuyên sâu.";
            case "LOW_CONFIDENCE":
                return "Độ tin cậy chẩn đoán tự động thấp. Đề xuất đặt dịch vụ để có kết luận chính xác hơn.";
            default:
                return null;
        }
    }

    public DiagnosisResponse convertToResponse(DiagnosisHistory history, boolean includeRecommendations) {
        String friendlyEscalation = translateEscalationReason(history.getEscalationReason());

        java.util.List<com.greenlife.plant.dto.PlantResponse> products = java.util.Collections.emptyList();
        java.util.List<com.greenlife.booking.dto.PlantCareServiceResponse> services = java.util.Collections.emptyList();

        if (includeRecommendations) {
            java.util.List<String> categories = deserializeList(history.getRecommendationCategories());
            var recommendationResult = diagnosisRecommendationService.resolveRecommendations(
                    categories,
                    history.getConfidenceScore(),
                    history.getSeverity(),
                    history.getUrgentWarning(),
                    history.getDiagnosable()
            );
            products = recommendationResult.getRecommendedProducts();
            services = recommendationResult.getRecommendedServices();
        }

        return DiagnosisResponse.builder()
                .id(history.getId())
                .diagnosisId(history.getId())
                .plantId(history.getPlant() != null ? history.getPlant().getId() : null)
                .plantName(history.getPlantName() != null ? history.getPlantName() : (history.getPlant() != null ? history.getPlant().getName() : null))
                .imageUrl(history.getImageUrl())
                .diseaseName(history.getDiseaseName())
                .confidenceScore(history.getConfidenceScore())
                .severity(history.getSeverity())
                .result(history.getResult())
                .recommendation(history.getRecommendation())
                .observedSymptoms(history.getObservedSymptoms())
                .possibleCauses(history.getPossibleCauses())
                .alternativeDiagnoses(deserializeList(history.getAlternativeDiagnoses()))
                .treatmentSteps(deserializeList(history.getTreatmentSteps()))
                .preventionSteps(deserializeList(history.getPreventionSteps()))
                .urgentWarning(history.getUrgentWarning())
                .disclaimer(history.getDisclaimer())
                .recommendedProducts(products)
                .recommendedServices(services)
                .provider(history.getProvider())
                .model(history.getModel())
                .processingStatus(history.getProcessingStatus())
                .expertReviewRecommended(history.getExpertReviewRecommended())
                .escalationReason(friendlyEscalation)
                .diagnosable(history.getDiagnosable())
                .uncertaintyReason(history.getUncertaintyReason())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
