package com.greenlife.service;

import com.greenlife.dto.UserProfileRequest;
import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public User updateProfile(User user, UserProfileRequest request) {
        if (user == null) {
            throw new CustomException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    @Transactional
    public String updateAvatar(User user, MultipartFile file) {
        if (user == null) {
            throw new CustomException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        String oldAvatarUrl = user.getAvatarUrl();
        String newAvatarUrl = null;

        try {
            // 1. Upload new avatar file
            newAvatarUrl = fileStorageService.storeAvatar(file);

            // 2. Update User.avatarUrl
            user.setAvatarUrl(newAvatarUrl);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.saveAndFlush(user);

            // 3. If DB update succeeds: delete old avatar file after transaction commit
            if (oldAvatarUrl != null) {
                final String urlToDelete = oldAvatarUrl;
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        fileStorageService.deleteFile(urlToDelete);
                    }
                });
            }

            return newAvatarUrl;

        } catch (Exception e) {
            // 4. If DB fails: delete new avatar file immediately
            if (newAvatarUrl != null) {
                fileStorageService.deleteFile(newAvatarUrl);
            }
            if (e instanceof CustomException) {
                throw (CustomException) e;
            }
            throw new CustomException("Lỗi cập nhật ảnh đại diện: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
