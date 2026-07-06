package com.greenlife.diagnosis.controller;

import com.greenlife.diagnosis.service.DiagnosisService;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/diagnoses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDiagnosisController {

    private final DiagnosisService diagnosisService;
    private final CurrentUserResolver currentUserResolver;

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> purgeDiagnosis(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User adminUser = currentUserResolver.resolveUser(userDetails);
        diagnosisService.purgeDiagnosis(id, adminUser);
        return ResponseEntity.noContent().build();
    }








}
