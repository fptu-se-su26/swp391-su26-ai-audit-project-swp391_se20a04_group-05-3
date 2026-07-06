package com.greenlife.user.controller;




import com.greenlife.user.dto.UserProfileRequest;
import com.greenlife.user.dto.UserResponse;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;

import com.greenlife.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final CurrentUserResolver currentUserResolver;

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UserProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        User updated = userProfileService.updateProfile(user, request);
        return ResponseEntity.ok(convertToResponse(updated));
    }

    @PostMapping("/avatar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> updateAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        String newAvatarUrl = userProfileService.updateAvatar(user, file);
        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật ảnh đại diện thành công",
                "avatarUrl", newAvatarUrl
        ));
    }









    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .build();
    }
}
