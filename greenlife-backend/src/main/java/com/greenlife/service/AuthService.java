package com.greenlife.service;

import com.greenlife.dto.*;
import com.greenlife.entity.LoginAudit;
import com.greenlife.repository.LoginAuditRepository;
import com.greenlife.entity.PasswordHistory;
import com.greenlife.entity.RefreshToken;
import com.greenlife.entity.Role;
import com.greenlife.entity.SecurityAudit;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.LoginFailureReason;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.exception.*;
import com.greenlife.repository.PasswordHistoryRepository;
import com.greenlife.repository.RefreshTokenRepository;
import com.greenlife.repository.RoleRepository;
import com.greenlife.repository.SecurityAuditRepository;
import com.greenlife.repository.UserRepository;
import com.greenlife.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final SecurityAuditRepository securityAuditRepository;
    private final LoginAuditRepository loginAuditRepository;
    private final SecurityAuditService securityAuditService;
    private final SecurityMonitoringService securityMonitoringService;

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        // Validate role for public registration
        String requestedRole = request.getRole().toUpperCase();
        if (!"CUSTOMER".equals(requestedRole) && !"STORE_OWNER".equals(requestedRole)) {
            throw new CustomException("Đăng ký vai trò này không được phép trên hệ thống công cộng", HttpStatus.BAD_REQUEST);
        }

        // Check unique email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("Email đã được sử dụng bởi tài khoản khác", HttpStatus.BAD_REQUEST);
        }

        // Get Role entity
        Role roleEntity = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new CustomException("Vai trò " + requestedRole + " không tồn tại trong hệ thống", HttpStatus.BAD_REQUEST));

        // Create User entity
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(roleEntity)
                .status(UserStatus.PENDING_VERIFICATION) // New users must verify email first
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Generate OTP
        String otp = otpService.createVerificationOtp(savedUser);

        // Send email
        emailService.sendVerificationOtp(savedUser.getEmail(), otp);

        return MessageResponse.builder()
                .message("Registration successful. Please verify your email.")
                .build();
    }

    @Transactional
    public MessageResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        otpService.verifyOtp(user, request.getOtp());

        return MessageResponse.builder()
                .message("Email verified successfully")
                .build();
    }

    @Transactional
    public MessageResponse resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        String otp = otpService.resendVerificationOtp(user);
        emailService.sendVerificationOtp(user.getEmail(), otp);

        return MessageResponse.builder()
                .message("OTP resent successfully")
                .build();
    }

    private static final String DUMMY_BCRYPT_HASH = "$2a$10$x.Xz4lqgX1HnB7z0p1xOueQWJcZq6Q7dI0jH.wB9o9kF.uR5r0i2e";

    @Transactional(noRollbackFor = {
            BadCredentialsException.class,
            AccountLockedException.class,
            AccountDisabledException.class,
            EmailNotVerifiedException.class
    })
    public LoginResult login(LoginRequest request, RequestMetadata metadata) {
        // Find user first to check status
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    // Timing-attack mitigation
                    passwordEncoder.matches(request.getPassword(), DUMMY_BCRYPT_HASH);

                    securityAuditService.recordLoginAudit(null, request.getEmail(), false, 
                            metadata.ipAddress(), metadata.userAgent(), LoginFailureReason.INVALID_CREDENTIALS);
                    securityMonitoringService.checkFailedLogins(null, request.getEmail());
                    return new BadCredentialsException("Email hoặc mật khẩu không chính xác");
                });

        // Validate account state first
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            securityAuditService.recordLoginAudit(user, request.getEmail(), false, 
                    metadata.ipAddress(), metadata.userAgent(), LoginFailureReason.EMAIL_NOT_VERIFIED);
            securityAuditService.recordSecurityAudit(user, SecurityAuditAction.LOGIN_FAILED, "Failed login attempt: email not verified");
            throw new EmailNotVerifiedException("Tài khoản chưa được xác thực email");
        }

        if (user.getStatus() == UserStatus.DISABLED) {
            securityAuditService.recordLoginAudit(user, request.getEmail(), false, 
                    metadata.ipAddress(), metadata.userAgent(), LoginFailureReason.ACCOUNT_DISABLED);
            securityAuditService.recordSecurityAudit(user, SecurityAuditAction.LOGIN_FAILED, "Failed login attempt: account disabled");
            throw new AccountDisabledException("Tài khoản đã bị vô hiệu hóa");
        }

        boolean shouldUnlock = false;
        if (user.getStatus() == UserStatus.LOCKED) {
            if (user.getLockoutEnd() != null && user.getLockoutEnd().isAfter(LocalDateTime.now())) {
                securityAuditService.recordLoginAudit(user, request.getEmail(), false, 
                        metadata.ipAddress(), metadata.userAgent(), LoginFailureReason.ACCOUNT_LOCKED);
                securityAuditService.recordSecurityAudit(user, SecurityAuditAction.LOGIN_FAILED, "Failed login attempt: account locked");
                long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getLockoutEnd()).toMinutes() + 1;
                throw new AccountLockedException("Tài khoản của bạn đã bị khóa. Vui lòng thử lại sau " + minutesLeft + " phút.");
            } else {
                shouldUnlock = true;
            }
        }

        // Authenticate
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            // Record failed login audit first
            securityAuditService.recordLoginAudit(user, request.getEmail(), false, 
                    metadata.ipAddress(), metadata.userAgent(), LoginFailureReason.INVALID_CREDENTIALS);
            securityAuditService.recordSecurityAudit(user, SecurityAuditAction.LOGIN_FAILED, "Failed login attempt: invalid credentials");

            // Monitor suspicious logins
            securityMonitoringService.checkFailedLogins(user, request.getEmail());

            int newAttempts = (shouldUnlock ? 0 : user.getFailedLoginAttempts()) + 1;
            if (newAttempts >= 5) {
                // Record ACCOUNT_LOCKED BEFORE modifying the user entity in Transaction A!
                securityAuditService.recordSecurityAudit(user, SecurityAuditAction.ACCOUNT_LOCKED, "Account locked out due to too many failed attempts");
                user.setStatus(UserStatus.LOCKED);
                user.setLockoutEnd(LocalDateTime.now().plusMinutes(30));
            } else if (shouldUnlock) {
                user.setStatus(UserStatus.ACTIVE);
                user.setLockoutEnd(null);
            }
            user.setFailedLoginAttempts(newAttempts);
            userRepository.save(user);

            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }

        // Record successful login audits first
        securityAuditService.recordLoginAudit(user, request.getEmail(), true, 
                metadata.ipAddress(), metadata.userAgent(), null);
        securityAuditService.recordSecurityAudit(user, SecurityAuditAction.LOGIN_SUCCESS, "Successful login from IP: " + metadata.ipAddress());

        // Check for suspicious activity: IP Hopping
        securityMonitoringService.checkIpHopping(user, metadata.ipAddress());

        // Reset attempts on successful login and save
        user.setFailedLoginAttempts(0);
        user.setLockoutEnd(null);
        if (shouldUnlock) {
            user.setStatus(UserStatus.ACTIVE);
        }
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(metadata.ipAddress());
        userRepository.save(user);

        // Generate access token (expiring in 15 minutes)
        String accessToken = jwtService.generateToken(user);

        // Generate raw refresh token (expiring in 7 days)
        String rawRefreshToken = generateRawToken();
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .build();

        return LoginResult.builder()
                .authResponse(authResponse)
                .rawRefreshToken(rawRefreshToken)
                .build();
    }

    @Transactional(noRollbackFor = RefreshTokenReplayAttackException.class)
    public RefreshResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new CustomException("Refresh token is missing", HttpStatus.UNAUTHORIZED);
        }

        String tokenHash = hashToken(rawRefreshToken);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            throw new CustomException("Invalid refresh token", HttpStatus.UNAUTHORIZED);
        }

        RefreshToken token = tokenOpt.get();

        // Replay attack handling
        if (Boolean.TRUE.equals(token.getRevoked())) {
            Integer userId = token.getUser().getId();
            refreshTokenRepository.revokeAllUserTokens(userId);
            securityMonitoringService.handleRefreshTokenFailure(token.getUser(), "Token replay attack detected");
            throw new RefreshTokenReplayAttackException("Refresh token has been revoked. Reauthentication required.");
        }

        // Check expiration
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new CustomException("Refresh token has expired", HttpStatus.UNAUTHORIZED);
        }

        // Rotate: mark current token as revoked
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        // Generate new tokens
        User user = token.getUser();
        String newAccessToken = jwtService.generateToken(user);
        String newRawRefreshToken = generateRawToken();
        String newHash = hashToken(newRawRefreshToken);

        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(newHash)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        refreshTokenRepository.save(newRefreshToken);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .build();

        return RefreshResult.builder()
                .authResponse(authResponse)
                .newRawRefreshToken(newRawRefreshToken)
                .build();
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getStatus() == UserStatus.ACTIVE || user.getStatus() == UserStatus.LOCKED) {
                String otp = otpService.createPasswordResetOtp(user);
                emailService.sendPasswordResetOtp(user.getEmail(), otp);
            }
        }
        return new MessageResponse("If the account exists, a password reset OTP has been sent");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Passwords do not match");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new PasswordResetOtpInvalidException("Invalid OTP or reset information"));

        if (user.getStatus() != UserStatus.ACTIVE && user.getStatus() != UserStatus.LOCKED) {
            throw new PasswordResetOtpInvalidException("Invalid OTP or reset information");
        }

        otpService.verifyPasswordResetOtp(user, request.getOtp());

        verifyPasswordNotReused(user, request.getNewPassword());

        recordPasswordHistory(user, user.getPasswordHash());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        
        user.setFailedLoginAttempts(0);
        user.setLockoutEnd(null);
        if (user.getStatus() == UserStatus.LOCKED) {
            user.setStatus(UserStatus.ACTIVE);
        }

        userRepository.save(user);

        refreshTokenRepository.revokeAllUserTokens(user.getId());

        otpService.consumePasswordResetOtp(user);

        recordSecurityAudit(user, SecurityAuditAction.PASSWORD_RESET, "Password reset successfully via OTP verification flow");

        return new MessageResponse("Password reset successfully");
    }

    @Transactional(noRollbackFor = IncorrectPasswordException.class)
    public void changePassword(ChangePasswordRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            recordSecurityAudit(user, SecurityAuditAction.PASSWORD_CHANGE_FAILED, "Incorrect current password attempted");
            throw new IncorrectPasswordException("Incorrect current password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Passwords do not match");
        }

        verifyPasswordNotReused(user, request.getNewPassword());

        recordPasswordHistory(user, user.getPasswordHash());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.revokeAllUserTokens(user.getId());

        recordSecurityAudit(user, SecurityAuditAction.PASSWORD_CHANGED, "Password changed successfully via Change Password API");
    }

    private void verifyPasswordNotReused(User user, String newPassword) {
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new PasswordReuseException("Cannot reuse any of your last 5 passwords");
        }

        List<PasswordHistory> histories = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 5));
        for (PasswordHistory history : histories) {
            if (passwordEncoder.matches(newPassword, history.getPasswordHash())) {
                throw new PasswordReuseException("Cannot reuse any of your last 5 passwords");
            }
        }
    }

    private void recordPasswordHistory(User user, String oldHash) {
        PasswordHistory history = PasswordHistory.builder()
                .user(user)
                .passwordHash(oldHash)
                .createdAt(LocalDateTime.now())
                .build();
        passwordHistoryRepository.save(history);

        List<PasswordHistory> histories = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (histories.size() > 5) {
            List<PasswordHistory> toDelete = histories.subList(5, histories.size());
            passwordHistoryRepository.deleteAll(toDelete);
        }
    }

    private void recordSecurityAudit(User user, SecurityAuditAction action, String details) {
        securityAuditRepository.save(SecurityAudit.builder()
                .user(user)
                .action(action)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public UserResponse getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
        return mapToUserResponse(user);
    }

    public SecurityHistoryResponse getSecurityHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        List<LoginAudit> audits = loginAuditRepository.findTop20ByUserIdOrderByLoginTimeDesc(user.getId());

        List<LoginAuditResponse> successful = audits.stream()
                .filter(LoginAudit::isSuccess)
                .map(this::mapToLoginAuditResponse)
                .toList();

        List<LoginAuditResponse> failed = audits.stream()
                .filter(la -> !la.isSuccess())
                .map(this::mapToLoginAuditResponse)
                .toList();

        return SecurityHistoryResponse.builder()
                .lastLoginAt(user.getLastLoginAt())
                .lastLoginIp(user.getLastLoginIp())
                .recentSuccessfulLogins(successful)
                .recentFailedLogins(failed)
                .build();
    }

    private LoginAuditResponse mapToLoginAuditResponse(LoginAudit audit) {
        return LoginAuditResponse.builder()
                .id(audit.getId())
                .email(audit.getEmail())
                .success(audit.isSuccess())
                .ipAddress(audit.getIpAddress())
                .userAgent(audit.getUserAgent())
                .failureReason(audit.getFailureReason())
                .timestamp(audit.getLoginTime())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
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

    private String generateRawToken() {
        byte[] randomBytes = new byte[32];
        new java.security.SecureRandom().nextBytes(randomBytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String token) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing token", e);
        }
    }
}
