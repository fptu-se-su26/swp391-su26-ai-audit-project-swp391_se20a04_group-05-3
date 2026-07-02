package com.greenlife.controller;

import com.greenlife.dto.AdminLoginAuditResponse;
import com.greenlife.entity.LoginAudit;
import com.greenlife.repository.LoginAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/security")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSecurityController {

    private final LoginAuditRepository loginAuditRepository;

    @GetMapping("/login-audits")
    public ResponseEntity<Page<AdminLoginAuditResponse>> getAllLoginAudits(@PageableDefault(size = 20) Pageable pageable) {
        Page<LoginAudit> page = loginAuditRepository.findAll(pageable);
        return ResponseEntity.ok(page.map(this::mapToAdminLoginAuditResponse));
    }

    @GetMapping("/login-audits/{userId}")
    public ResponseEntity<Page<AdminLoginAuditResponse>> getUserLoginAudits(
            @PathVariable Integer userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<LoginAudit> page = loginAuditRepository.findByUserId(userId, pageable);
        return ResponseEntity.ok(page.map(this::mapToAdminLoginAuditResponse));
    }

    @GetMapping("/failed-logins")
    public ResponseEntity<Page<AdminLoginAuditResponse>> getFailedLoginAudits(@PageableDefault(size = 20) Pageable pageable) {
        Page<LoginAudit> page = loginAuditRepository.findBySuccess(false, pageable);
        return ResponseEntity.ok(page.map(this::mapToAdminLoginAuditResponse));
    }

    private AdminLoginAuditResponse mapToAdminLoginAuditResponse(LoginAudit audit) {
        return AdminLoginAuditResponse.builder()
                .id(audit.getId())
                .userId(audit.getUser() != null ? audit.getUser().getId() : null)
                .email(audit.getEmail())
                .success(audit.isSuccess())
                .ipAddress(audit.getIpAddress())
                .userAgent(audit.getUserAgent())
                .failureReason(audit.getFailureReason() != null ? audit.getFailureReason().name() : null)
                .timestamp(audit.getLoginTime())
                .build();
    }
}
