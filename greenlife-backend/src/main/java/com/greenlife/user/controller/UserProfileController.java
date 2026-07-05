package com.greenlife.user.controller;




import com.greenlife.user.dto.UserProfileRequest;
import com.greenlife.user.dto.UserResponse;
import com.greenlife.user.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final UserRepository userRepository;

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UserProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        User updated = userProfileService.updateProfile(user, request);
        return ResponseEntity.ok(convertToResponse(updated));
    }

    @PostMapping("/avatar")
    public ResponseEntity<Map<String, String>> updateAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        String newAvatarUrl = userProfileService.updateAvatar(user, file);
        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật ảnh đại diện thành công",
                "avatarUrl", newAvatarUrl
        ));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
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
