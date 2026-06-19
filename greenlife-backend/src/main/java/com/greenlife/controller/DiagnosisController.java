package com.greenlife.controller;

import com.greenlife.dto.DiagnosisResponse;
import com.greenlife.entity.DiagnosisHistory;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.Severity;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.UserRepository;
import com.greenlife.service.DiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/diagnoses")
@RequiredArgsConstructor
public class DiagnosisController {

    private final DiagnosisService diagnosisService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<DiagnosisResponse> createDiagnosis(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "plantId", required = false) Integer plantId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        DiagnosisHistory history = diagnosisService.createDiagnosis(user, file, plantId);
        return ResponseEntity.ok(convertToResponse(history));
    }

    @GetMapping
    public ResponseEntity<Page<DiagnosisResponse>> getMyDiagnoses(
            @RequestParam(value = "plantId", required = false) Integer plantId,
            @RequestParam(value = "severity", required = false) Severity severity,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        Page<DiagnosisHistory> diagnoses = diagnosisService.getCustomerDiagnoses(user.getId(), plantId, severity, pageable);
        return ResponseEntity.ok(diagnoses.map(this::convertToResponse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiagnosisResponse> getDiagnosisDetails(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        DiagnosisHistory diagnosis = diagnosisService.getDiagnosisDetails(id, user);
        return ResponseEntity.ok(convertToResponse(diagnosis));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }

    private DiagnosisResponse convertToResponse(DiagnosisHistory history) {
        return DiagnosisResponse.builder()
                .id(history.getId())
                .plantId(history.getPlant() != null ? history.getPlant().getId() : null)
                .imageUrl(history.getImageUrl())
                .diseaseName(history.getDiseaseName())
                .confidenceScore(history.getConfidenceScore())
                .severity(history.getSeverity())
                .result(history.getResult())
                .recommendation(history.getRecommendation())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
