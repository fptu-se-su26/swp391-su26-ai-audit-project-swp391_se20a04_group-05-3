package com.greenlife.service;

import com.greenlife.entity.User;
import com.greenlife.entity.UserOtp;
import com.greenlife.entity.enums.OtpPurpose;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.exception.*;
import com.greenlife.repository.UserOtpRepository;
import com.greenlife.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final UserOtpRepository userOtpRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp() {
        int otp = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otp);
    }

    public String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Algorithm SHA-256 not found", e);
        }
    }

    @Transactional
    public String createVerificationOtp(User user) {
        // Enforce 60-second rate limit
        Optional<UserOtp> existingOtp = userOtpRepository.findByUserAndPurpose(user, OtpPurpose.VERIFICATION);
        if (existingOtp.isPresent()) {
            UserOtp otpEntity = existingOtp.get();
            if (LocalDateTime.now().isBefore(otpEntity.getCreatedAt().plusSeconds(60))) {
                throw new OtpRateLimitException("Yêu cầu gửi mã OTP quá nhanh. Vui lòng đợi 60 giây.");
            }
            userOtpRepository.delete(otpEntity);
            userOtpRepository.flush();
        }

        String plainOtp = generateOtp();
        String hashedOtp = hashOtp(plainOtp);

        UserOtp userOtp = UserOtp.builder()
                .user(user)
                .otpHash(hashedOtp)
                .purpose(OtpPurpose.VERIFICATION)
                .attempts(0)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        userOtpRepository.save(userOtp);
        return plainOtp;
    }

    @Transactional
    public void verifyOtp(User user, String otp) {
        if (user.getStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new UserNotPendingVerificationException("Tài khoản của bạn đã được xác thực hoặc không ở trạng thái chờ xác thực.");
        }

        UserOtp otpEntity = userOtpRepository.findByUserAndPurpose(user, OtpPurpose.VERIFICATION)
                .orElseThrow(() -> new OtpInvalidException("Mã xác thực không tồn tại hoặc đã bị thu hồi."));

        // Check expiration
        if (LocalDateTime.now().isAfter(otpEntity.getExpiresAt())) {
            userOtpRepository.delete(otpEntity);
            userOtpRepository.flush();
            throw new OtpExpiredException("Mã xác thực đã hết hạn.");
        }

        // Compare SHA-256 hash
        String hashedInput = hashOtp(otp);
        if (otpEntity.getOtpHash().equals(hashedInput)) {
            // Activate User
            user.setStatus(UserStatus.ACTIVE);
            user.setEmailVerified(true);
            userRepository.save(user);

            // Clean up OTP
            userOtpRepository.delete(otpEntity);
            userOtpRepository.flush();
        } else {
            // Increment attempts
            int currentAttempts = otpEntity.getAttempts() + 1;
            otpEntity.setAttempts(currentAttempts);

            if (currentAttempts >= 3) {
                userOtpRepository.delete(otpEntity);
                userOtpRepository.flush();
                throw new OtpAttemptsExceededException("Bạn đã nhập sai mã OTP quá 3 lần. Vui lòng yêu cầu gửi lại mã mới.");
            } else {
                userOtpRepository.save(otpEntity);
                throw new OtpInvalidException("Mã OTP không chính xác. Bạn còn " + (3 - currentAttempts) + " lần thử.");
            }
        }
    }

    @Transactional
    public String resendVerificationOtp(User user) {
        if (user.getStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new UserNotPendingVerificationException("Tài khoản của bạn đã được xác thực hoặc không ở trạng thái chờ xác thực.");
        }
        return createVerificationOtp(user);
    }

    @Transactional
    public String createPasswordResetOtp(User user) {
        // Enforce 60-second rate limit
        Optional<UserOtp> existingOtp = userOtpRepository.findByUserAndPurpose(user, OtpPurpose.PASSWORD_RESET);
        if (existingOtp.isPresent()) {
            UserOtp otpEntity = existingOtp.get();
            if (LocalDateTime.now().isBefore(otpEntity.getCreatedAt().plusSeconds(60))) {
                throw new OtpRateLimitException("Yêu cầu gửi mã OTP quá nhanh. Vui lòng đợi 60 giây.");
            }
            userOtpRepository.delete(otpEntity);
            userOtpRepository.flush();
        }

        String plainOtp = generateOtp();
        String hashedOtp = hashOtp(plainOtp);

        UserOtp userOtp = UserOtp.builder()
                .user(user)
                .otpHash(hashedOtp)
                .purpose(OtpPurpose.PASSWORD_RESET)
                .attempts(0)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        userOtpRepository.save(userOtp);
        return plainOtp;
    }

    @Transactional
    public void verifyPasswordResetOtp(User user, String otp) {
        UserOtp otpEntity = userOtpRepository.findByUserAndPurpose(user, OtpPurpose.PASSWORD_RESET)
                .orElseThrow(() -> new PasswordResetOtpInvalidException("Invalid OTP or reset information"));

        // Check expiration
        if (LocalDateTime.now().isAfter(otpEntity.getExpiresAt())) {
            userOtpRepository.delete(otpEntity);
            userOtpRepository.flush();
            throw new PasswordResetOtpExpiredException("Password reset OTP has expired");
        }

        // Compare SHA-256 hash
        String hashedInput = hashOtp(otp);
        if (otpEntity.getOtpHash().equals(hashedInput)) {
            // OTP matches. Do NOT delete here. AuthService will call consumePasswordResetOtp.
        } else {
            // Increment attempts
            int currentAttempts = otpEntity.getAttempts() + 1;
            otpEntity.setAttempts(currentAttempts);

            if (currentAttempts >= 3) {
                userOtpRepository.delete(otpEntity);
                userOtpRepository.flush();
                throw new OtpAttemptsExceededException("Too many invalid OTP attempts. Please request a new OTP.");
            } else {
                userOtpRepository.save(otpEntity);
                throw new PasswordResetOtpInvalidException("Invalid OTP or reset information");
            }
        }
    }

    @Transactional
    public void consumePasswordResetOtp(User user) {
        userOtpRepository.deleteByUserAndPurpose(user, OtpPurpose.PASSWORD_RESET);
        userOtpRepository.flush();
    }
}
