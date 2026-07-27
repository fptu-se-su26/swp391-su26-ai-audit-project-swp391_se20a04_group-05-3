package com.greenlife;
import com.greenlife.common.service.EmailService;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.auth.dto.*;
import com.greenlife.auth.entity.*;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.enums.UserStatus;

import com.greenlife.auth.entity.enums.*;
import com.greenlife.auth.repository.*;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.repository.RoleRepository;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ForgotPasswordIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserOtpRepository userOtpRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @MockitoBean
    private EmailService emailService;

    private Role customerRole;
    private final String testEmail = "forgot_test@gmail.com";
    private User testUser;

    @BeforeEach
    void setUp() {
        // Ensure password_histories and security_audits tables exist
        try {
            jdbcTemplate.execute(
                    "IF OBJECT_ID('password_histories', 'U') IS NULL " +
                    "BEGIN " +
                    "    CREATE TABLE password_histories ( " +
                    "        id BIGINT IDENTITY(1,1) PRIMARY KEY, " +
                    "        user_id INT NOT NULL, " +
                    "        password_hash VARCHAR(255) NOT NULL, " +
                    "        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), " +
                    "        CONSTRAINT fk_histories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE " +
                    "    ); " +
                    "END"
            );
            jdbcTemplate.execute(
                    "IF OBJECT_ID('security_audits', 'U') IS NULL " +
                    "BEGIN " +
                    "    CREATE TABLE security_audits ( " +
                    "        id BIGINT IDENTITY(1,1) PRIMARY KEY, " +
                    "        user_id INT NULL, " +
                    "        action VARCHAR(50) NOT NULL, " +
                    "        details NVARCHAR(500) NULL, " +
                    "        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), " +
                    "        CONSTRAINT fk_security_audits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL " +
                    "    ); " +
                    "END"
            );
        } catch (Exception ignored) {}

        try {
            try {
                jdbcTemplate.execute("ALTER TABLE user_otps DROP CONSTRAINT chk_otps_purpose;");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE user_otps ADD CONSTRAINT chk_otps_purpose CHECK (purpose IN ('VERIFICATION', 'PASSWORD_RESET', 'SELLER_REGISTRATION'));");
            } catch (Exception ignored) {}
        } catch (Exception ignored) {}

        refreshTokenRepository.deleteAll();
        userOtpRepository.deleteAll();
        cleanupPasswordHistoryAndAudits();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);

        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        testUser = userRepository.save(User.builder()
                .fullName("Forgot Test User")
                .email(testEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .failedLoginAttempts(0)
                .build());
    }

    @AfterEach
    void tearDown() {
        refreshTokenRepository.deleteAll();
        userOtpRepository.deleteAll();
        cleanupPasswordHistoryAndAudits();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);
    }

    private void cleanupPasswordHistoryAndAudits() {
        try {
            userRepository.findByEmail(testEmail).ifPresent(user -> {
                try {
                    jdbcTemplate.update("DELETE FROM security_audits WHERE user_id = ?", user.getId());
                } catch (Exception ignored) {}
                try {
                    jdbcTemplate.update("DELETE FROM password_histories WHERE user_id = ?", user.getId());
                } catch (Exception ignored) {}
            });
        } catch (Exception ignored) {}
    }

    @Test
    void testForgotPasswordSuccess() throws Exception {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("If the account exists, a password reset OTP has been sent")));

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());
        assertNotNull(otpCaptor.getValue());
    }

    @Test
    void testForgotPasswordAntiEnumerationUnknownEmail() throws Exception {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("unknown_user@gmail.com")
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("If the account exists, a password reset OTP has been sent")));

        verify(emailService, never()).sendPasswordResetOtp(eq("unknown_user@gmail.com"), anyString());
    }

    @Test
    void testForgotPasswordAntiEnumerationDisabledAccount() throws Exception {
        testUser.setStatus(UserStatus.DISABLED);
        userRepository.save(testUser);

        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("If the account exists, a password reset OTP has been sent")));

        verify(emailService, never()).sendPasswordResetOtp(eq(testEmail), anyString());
    }

    @Test
    void testForgotPasswordAntiEnumerationUnverifiedAccount() throws Exception {
        testUser.setStatus(UserStatus.PENDING_VERIFICATION);
        userRepository.save(testUser);

        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("If the account exists, a password reset OTP has been sent")));

        verify(emailService, never()).sendPasswordResetOtp(eq(testEmail), anyString());
    }

    @Test
    void testForgotPasswordRateLimit() throws Exception {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        // 1st request
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // 2nd request immediately
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error", containsString("Yêu cầu gửi mã OTP quá nhanh")));
    }

    @Test
    void testResetPasswordMismatch() throws Exception {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email(testEmail)
                .otp("123456")
                .newPassword("Password123!")
                .confirmPassword("DifferentPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Passwords do not match")));
    }

    @Test
    void testResetPasswordUnknownEmailAntiLeakage() throws Exception {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("unknown_reset@gmail.com")
                .otp("123456")
                .newPassword("Password123!")
                .confirmPassword("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Invalid OTP or reset information")));
    }

    @Test
    void testResetPasswordInvalidOtp() throws Exception {
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email(testEmail)
                .otp("000000") // Wrong OTP
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Invalid OTP or reset information")));
    }

    @Test
    void testResetPasswordExpiredOtp() throws Exception {
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        // Make OTP expired in DB manually
        UserOtp otp = userOtpRepository.findByUserAndPurpose(testUser, OtpPurpose.PASSWORD_RESET).orElseThrow();
        otp.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        userOtpRepository.save(otp);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email(testEmail)
                .otp(otpCaptor.getValue())
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.error", is("Password reset OTP has expired")));
    }

    @Test
    void testResetPasswordSuccessAndReplayPrevention() throws Exception {
        // 1. Forgot password request
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());
        String activeOtp = otpCaptor.getValue();

        // Lock the user status to verify that reset unlocks it
        testUser.setStatus(UserStatus.LOCKED);
        testUser.setFailedLoginAttempts(5);
        testUser.setLockoutEnd(LocalDateTime.now().plusMinutes(30));
        userRepository.save(testUser);

        // 2. Perform reset
        ResetPasswordRequest resetRequest = ResetPasswordRequest.builder()
                .email(testEmail)
                .otp(activeOtp)
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Password reset successfully")));

        // 3. Verify user status became ACTIVE, failedLoginAttempts reset to 0, lockoutEnd cleared, and password hashed
        User updatedUser = userRepository.findByEmail(testEmail).orElseThrow();
        assertEquals(UserStatus.ACTIVE, updatedUser.getStatus());
        assertEquals(0, updatedUser.getFailedLoginAttempts());
        assertNull(updatedUser.getLockoutEnd());
        assertTrue(passwordEncoder.matches("NewPassword123!", updatedUser.getPasswordHash()));

        // 4. Verify OTP record is deleted completely (single-use)
        Optional<UserOtp> otpAfterSuccess = userOtpRepository.findByUserAndPurpose(updatedUser, OtpPurpose.PASSWORD_RESET);
        assertTrue(otpAfterSuccess.isEmpty());

        // 5. Replay attempt: Try to reuse same OTP
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Invalid OTP or reset information")));
    }

    @Test
    void testSessionInvalidationAfterPasswordReset() throws Exception {
        // 1. Login successfully to get refresh token
        LoginRequest loginRequest = LoginRequest.builder()
                .email(testEmail)
                .password("Password123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshTokenCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshTokenCookie);

        // Verify active token exists in DB
        long activeCount = refreshTokenRepository.count();
        assertTrue(activeCount > 0);

        // 2. Perform password reset
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email(testEmail)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());
        String activeOtp = otpCaptor.getValue();

        ResetPasswordRequest resetRequest = ResetPasswordRequest.builder()
                .email(testEmail)
                .otp(activeOtp)
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk());

        // 3. Attempt POST /api/auth/refresh using the old cookie
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshTokenCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Refresh token has been revoked")));
    }
}
