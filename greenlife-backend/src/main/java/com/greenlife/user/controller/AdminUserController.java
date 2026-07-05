package com.greenlife.user.controller;




import com.greenlife.user.dto.AdminUserResponse;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<AdminUserResponse>> searchUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) UserStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<AdminUserResponse> users = adminUserService.searchUsers(keyword, role, status, pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserResponse> getUserDetails(@PathVariable("id") Integer id) {
        AdminUserResponse user = adminUserService.getUserDetails(id);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<AdminUserResponse> lockUser(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User adminUser = resolveUserRequired(userDetails);
        AdminUserResponse user = adminUserService.lockUser(id, adminUser);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/{id}/unlock")
    public ResponseEntity<AdminUserResponse> unlockUser(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User adminUser = resolveUserRequired(userDetails);
        AdminUserResponse user = adminUserService.unlockUser(id, adminUser);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminUserResponse> updateStatus(
            @PathVariable("id") Integer id,
            @RequestParam("status") UserStatus status,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User adminUser = resolveUserRequired(userDetails);
        AdminUserResponse user = adminUserService.updateStatus(id, status, adminUser);
        return ResponseEntity.ok(user);
    }

    private User resolveUserRequired(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }
}
