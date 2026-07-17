package com.greenlife.diagnosis.controller;

import com.greenlife.diagnosis.dto.DiagnosisResponse;
import com.greenlife.diagnosis.entity.DiagnosisHistory;
import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.diagnosis.service.DiagnosisService;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/diagnoses")
@RequiredArgsConstructor
public class DiagnosisController {

    private final DiagnosisService diagnosisService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<DiagnosisResponse> createDiagnosis(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "plantId", required = false) Integer plantId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        DiagnosisHistory history = diagnosisService.createDiagnosis(user, file, plantId);
        return ResponseEntity.ok(diagnosisService.convertToResponse(history, true));
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<DiagnosisResponse>> getMyDiagnoses(
            @RequestParam(value = "plantId", required = false) Integer plantId,
            @RequestParam(value = "severity", required = false) Severity severity,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        Page<DiagnosisHistory> diagnoses = diagnosisService.getCustomerDiagnoses(user.getId(), plantId, severity, pageable);
        return ResponseEntity.ok(diagnoses.map(h -> diagnosisService.convertToResponse(h, false)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DiagnosisResponse> getDiagnosisDetails(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        DiagnosisHistory diagnosis = diagnosisService.getDiagnosisDetails(id, user);
        return ResponseEntity.ok(diagnosisService.convertToResponse(diagnosis, true));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> deleteDiagnosis(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        diagnosisService.deleteDiagnosisForCustomer(id, user);
        return ResponseEntity.noContent().build();
    }
}
