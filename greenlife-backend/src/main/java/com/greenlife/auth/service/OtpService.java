package com.greenlife.auth.service;

import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.UserOtp;
import com.greenlife.auth.entity.enums.OtpPurpose;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.exception.*;
import com.greenlife.auth.repository.UserOtpRepository;
import com.greenlife.user.repository.UserRepository;
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

    public static final int OTP_EXPIRY_MINUTES = 3;

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
        }

        // Enforce resend limit: maximum 3 resend attempts (total 3 OTPs) within 10 minutes
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        long count = userOtpRepository.countByUserAndCreatedAtAfter(user, tenMinutesAgo);
        if (count >= 3) {
            throw new CustomException("Too many resend attempts. Please try again later.", org.springframework.http.HttpStatus.TOO_MANY_REQUESTS);
        }

        String plainOtp = generateOtp();
        String hashedOtp = hashOtp(plainOtp);

        UserOtp userOtp = UserOtp.builder()
                .user(user)
                .otpHash(hashedOtp)
                .purpose(OtpPurpose.VERIFICATION)
                .attempts(0)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
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
            userOtpRepository.deleteByUserAndPurpose(user, OtpPurpose.VERIFICATION);
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
            userOtpRepository.deleteByUserAndPurpose(user, OtpPurpose.VERIFICATION);
            userOtpRepository.flush();
        } else {
            // Increment attempts
            int currentAttempts = otpEntity.getAttempts() + 1;
            otpEntity.setAttempts(currentAttempts);

            if (currentAttempts >= 3) {
                userOtpRepository.deleteByUserAndPurpose(user, OtpPurpose.VERIFICATION);
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
        }

        // Enforce resend limit: maximum 3 resend attempts within 10 minutes
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        long count = userOtpRepository.countByUserAndCreatedAtAfter(user, tenMinutesAgo);
        if (count >= 3) {
            throw new CustomException("Too many resend attempts. Please try again later.", org.springframework.http.HttpStatus.TOO_MANY_REQUESTS);
        }

        String plainOtp = generateOtp();
        String hashedOtp = hashOtp(plainOtp);

        UserOtp userOtp = UserOtp.builder()
                .user(user)
                .otpHash(hashedOtp)
                .purpose(OtpPurpose.PASSWORD_RESET)
                .attempts(0)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
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
            userOtpRepository.deleteByUserAndPurpose(user, OtpPurpose.PASSWORD_RESET);
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
                userOtpRepository.deleteByUserAndPurpose(user, OtpPurpose.PASSWORD_RESET);
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

    public static String normalizePartnerEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }

    @Transactional
    public String createSellerRegistrationOtp(User user, String targetEmail) {
        String normEmail = normalizePartnerEmail(targetEmail);
        LocalDateTime now = LocalDateTime.now();

        // Enforce 10-minute resend limit (max 3 resends)
        LocalDateTime tenMinutesAgo = now.minusMinutes(10);
        long count = userOtpRepository.countByUserAndPurposeAndCreatedAtAfter(user, OtpPurpose.SELLER_REGISTRATION, tenMinutesAgo);
        if (count >= 3) {
            throw new CustomException("Bạn đã yêu cầu gửi mã OTP quá nhiều lần. Vui lòng thử lại sau 10 phút.", org.springframework.http.HttpStatus.TOO_MANY_REQUESTS);
        }

        // Lock & fetch existing SELLER_REGISTRATION OTPs for user
        java.util.List<UserOtp> existingOtps = userOtpRepository.findByUserAndPurposeForUpdate(user, OtpPurpose.SELLER_REGISTRATION);
        if (existingOtps != null && !existingOtps.isEmpty()) {
            UserOtp latest = existingOtps.get(0);
            // Check 60-second cooldown
            if (now.isBefore(latest.getCreatedAt().plusSeconds(60))) {
                throw new OtpRateLimitException("Yêu cầu gửi mã OTP quá nhanh. Vui lòng đợi 60 giây.");
            }
            // Invalidate prior active OTPs/proofs by setting expiresAt = now
            for (UserOtp oldOtp : existingOtps) {
                if (oldOtp.getExpiresAt().isAfter(now)) {
                    oldOtp.setExpiresAt(now);
                    userOtpRepository.save(oldOtp);
                }
            }
        }

        String plainOtp = generateOtp();
        String hashedOtp = hashOtp(plainOtp + ":" + normEmail);

        UserOtp userOtp = UserOtp.builder()
                .user(user)
                .otpHash(hashedOtp)
                .purpose(OtpPurpose.SELLER_REGISTRATION)
                .attempts(0)
                .expiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .createdAt(now)
                .build();

        userOtpRepository.save(userOtp);
        return plainOtp;
    }

    @Transactional
    public void verifySellerRegistrationOtp(User user, String targetEmail, String otp) {
        String normEmail = normalizePartnerEmail(targetEmail);
        LocalDateTime now = LocalDateTime.now();

        java.util.List<UserOtp> existingOtps = userOtpRepository.findByUserAndPurposeForUpdate(user, OtpPurpose.SELLER_REGISTRATION);
        if (existingOtps == null || existingOtps.isEmpty()) {
            throw new OtpInvalidException("Mã xác thực không tồn tại hoặc đã bị thu hồi.");
        }

        UserOtp latestOtp = existingOtps.get(0);
        String expectedProofHash = hashOtp("VERIFIED:" + user.getId() + ":" + normEmail);

        // Check if latest record is ALREADY a valid verified proof for this user + normEmail
        if (latestOtp.getOtpHash().equals(expectedProofHash) && latestOtp.getExpiresAt().isAfter(now)) {
            // Idempotent success: already verified and still valid
            return;
        }

        // Check expiration
        if (now.isAfter(latestOtp.getExpiresAt())) {
            latestOtp.setExpiresAt(now);
            userOtpRepository.save(latestOtp);
            throw new OtpExpiredException("Mã xác thực đã hết hạn.");
        }

        // Compare SHA-256 hash of plainOtp + ":" + normEmail
        String hashedInput = hashOtp(otp + ":" + normEmail);
        if (latestOtp.getOtpHash().equals(hashedInput)) {
            // Mark as verified proof!
            latestOtp.setOtpHash(expectedProofHash);
            latestOtp.setExpiresAt(now.plusMinutes(15)); // 15-minute window to complete registration
            latestOtp.setAttempts(0);
            userOtpRepository.save(latestOtp);
        } else {
            int currentAttempts = latestOtp.getAttempts() + 1;
            latestOtp.setAttempts(currentAttempts);

            if (currentAttempts >= 3) {
                latestOtp.setExpiresAt(now);
                userOtpRepository.save(latestOtp);
                throw new OtpAttemptsExceededException("Bạn đã nhập sai mã OTP quá 3 lần. Vui lòng yêu cầu gửi lại mã mới.");
            } else {
                userOtpRepository.save(latestOtp);
                throw new OtpInvalidException("Mã OTP không chính xác. Bạn còn " + (3 - currentAttempts) + " lần thử.");
            }
        }
    }

    @Transactional
    public void consumeSellerRegistrationOtpProof(User user, String targetEmail) {
        String normEmail = normalizePartnerEmail(targetEmail);
        LocalDateTime now = LocalDateTime.now();

        java.util.List<UserOtp> existingOtps = userOtpRepository.findByUserAndPurposeForUpdate(user, OtpPurpose.SELLER_REGISTRATION);
        if (existingOtps == null || existingOtps.isEmpty()) {
            throw new CustomException("Vui lòng xác thực mã OTP trước khi hoàn tất đăng ký cửa hàng", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        UserOtp latestOtp = existingOtps.get(0);
        String expectedProofHash = hashOtp("VERIFIED:" + user.getId() + ":" + normEmail);

        if (!latestOtp.getOtpHash().equals(expectedProofHash) || now.isAfter(latestOtp.getExpiresAt())) {
            throw new CustomException("Vui lòng xác thực mã OTP trước khi hoàn tất đăng ký cửa hàng", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        // Consume proof by setting expiresAt = now (invalidating it for future registration calls)
        // without deleting the record, preserving the 10-minute rate limit count history!
        latestOtp.setExpiresAt(now);
        userOtpRepository.save(latestOtp);
    }
}
