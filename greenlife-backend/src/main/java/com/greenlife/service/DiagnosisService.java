package com.greenlife.service;
import com.greenlife.common.service.FileStorageService;

import com.greenlife.dto.DiagnosisResult;
import com.greenlife.entity.DiagnosisHistory;
import com.greenlife.entity.Plant;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.entity.enums.Severity;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.DiagnosisHistoryRepository;
import com.greenlife.repository.PlantRepository;
import com.greenlife.repository.specification.DiagnosisHistorySpecifications;
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

@Service
@RequiredArgsConstructor
public class DiagnosisService {

    private final DiagnosisHistoryRepository diagnosisHistoryRepository;
    private final PlantRepository plantRepository;
    private final FileStorageService fileStorageService;
    private final PlantDiseaseClassifier plantDiseaseClassifier;
    private final SecurityAuditService securityAuditService;

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
}
