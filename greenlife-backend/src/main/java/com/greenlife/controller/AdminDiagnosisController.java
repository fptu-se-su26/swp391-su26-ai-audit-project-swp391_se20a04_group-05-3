package com.greenlife.controller;

import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.UserRepository;
import com.greenlife.service.DiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final UserRepository userRepository;

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> purgeDiagnosis(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User adminUser = resolveUser(userDetails);
        diagnosisService.purgeDiagnosis(id, adminUser);
        return ResponseEntity.noContent().build();
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }
}
