package com.greenlife.user.service;


import com.greenlife.user.dto.AdminUserResponse;
import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.enums.SecurityAuditAction;
import com.greenlife.auth.service.SecurityAuditService;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.repository.specification.UserSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserRepository userRepository;
    private final SecurityAuditService securityAuditService;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> searchUsers(String keyword, String role, UserStatus status, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 50);
        Pageable restrictedPageable = PageRequest.of(pageable.getPageNumber(), pageSize, pageable.getSort());

        Specification<User> spec = Specification.allOf(
                UserSpecifications.hasKeyword(keyword),
                UserSpecifications.hasRole(role),
                UserSpecifications.hasStatus(status)
        );

        return userRepository.findAll(spec, restrictedPageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserDetails(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));
        return mapToResponse(user);
    }

    @Transactional
    public AdminUserResponse lockUser(Integer id, User adminUser) {
        if (adminUser.getId().equals(id)) {
            throw new CustomException("Không thể tự thay đổi trạng thái tài khoản của chính mình", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        if (user.getStatus() != UserStatus.LOCKED) {
            user.setStatus(UserStatus.LOCKED);
            user = userRepository.saveAndFlush(user);
        }

        try {
            String desc = String.format("Admin %s locked user account ID %d", adminUser.getEmail(), id);
            securityAuditService.recordSecurityAudit(adminUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for locking user", e);
        }

        return mapToResponse(user);
    }

    @Transactional
    public AdminUserResponse unlockUser(Integer id, User adminUser) {
        if (adminUser.getId().equals(id)) {
            throw new CustomException("Không thể tự thay đổi trạng thái tài khoản của chính mình", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        if (user.getStatus() == UserStatus.LOCKED || user.getFailedLoginAttempts() > 0 || user.getLockoutEnd() != null) {
            user.setStatus(UserStatus.ACTIVE);
            user.setFailedLoginAttempts(0);
            user.setLockoutEnd(null);
            user = userRepository.saveAndFlush(user);
        }

        try {
            String desc = String.format("Admin %s unlocked user account ID %d", adminUser.getEmail(), id);
            securityAuditService.recordSecurityAudit(adminUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for unlocking user", e);
        }

        return mapToResponse(user);
    }

    @Transactional
    public AdminUserResponse updateStatus(Integer id, UserStatus status, User adminUser) {
        if (adminUser.getId().equals(id)) {
            throw new CustomException("Không thể tự thay đổi trạng thái tài khoản của chính mình", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        user.setStatus(status);
        user = userRepository.saveAndFlush(user);

        try {
            String desc = String.format("Admin %s changed status of user ID %d to %s", adminUser.getEmail(), id, status.name());
            securityAuditService.recordSecurityAudit(adminUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for user status update", e);
        }

        return mapToResponse(user);
    }

    private AdminUserResponse mapToResponse(User user) {
        if (user == null) return null;
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .lockoutEnd(user.getLockoutEnd())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
