package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.ChangePasswordRequest;
import com.greenlife.dto.ResetPasswordRequest;
import com.greenlife.entity.Role;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.*;
import com.greenlife.security.JwtService;
import com.greenlife.service.OtpService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PasswordSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @org.springframework.boot.test.mock.mockito.MockBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;

    @Autowired
    private SecurityAuditRepository securityAuditRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private OtpService otpService;

    private final String testEmail = "test_password_user@gmail.com";
    private Role customerRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Ensure password_histories and security_audits tables exist
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

        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        cleanupDatabase();

        testUser = userRepository.save(User.builder()
                .fullName("Test Password User")
                .email(testEmail)
                .passwordHash(passwordEncoder.encode("OldPassword123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        userRepository.findByEmail(testEmail).ifPresent(user -> {
            securityAuditRepository.deleteAll(securityAuditRepository.findAll().stream()
                    .filter(a -> a.getUser() != null && a.getUser().getId().equals(user.getId()))
                    .collect(java.util.stream.Collectors.toList()));
            passwordHistoryRepository.deleteAll(passwordHistoryRepository.findAll().stream()
                    .filter(h -> h.getUser() != null && h.getUser().getId().equals(user.getId()))
                    .collect(java.util.stream.Collectors.toList()));
            refreshTokenRepository.deleteAll(refreshTokenRepository.findAll().stream()
                    .filter(t -> t.getUser() != null && t.getUser().getId().equals(user.getId()))
                    .collect(java.util.stream.Collectors.toList()));
            userRepository.delete(user);
        });
    }

    @Test
    void testSuccessfulPasswordChange() throws Exception {
        String token = jwtService.generateToken(testUser);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Password changed successfully")));

        User updatedUser = userRepository.findByEmail(testEmail).orElseThrow();
        assertTrue(passwordEncoder.matches("NewPassword123!", updatedUser.getPasswordHash()));

        // Verify history entry saved
        var histories = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertEquals(1, histories.size());
        assertTrue(passwordEncoder.matches("OldPassword123!", histories.get(0).getPasswordHash()));

        // Verify audit created
        var audits = securityAuditRepository.findAll().stream()
                .filter(a -> a.getUser() != null && a.getUser().getId().equals(testUser.getId()))
                .toList();
        assertEquals(1, audits.size());
        assertEquals(SecurityAuditAction.PASSWORD_CHANGED, audits.get(0).getAction());
    }

    @Test
    void testIncorrectCurrentPassword() throws Exception {
        String token = jwtService.generateToken(testUser);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("WrongPassword123!")
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Incorrect current password")));

        // Verify failure audit created
        var audits = securityAuditRepository.findAll().stream()
                .filter(a -> a.getUser() != null && a.getUser().getId().equals(testUser.getId()))
                .toList();
        assertEquals(1, audits.size());
        assertEquals(SecurityAuditAction.PASSWORD_CHANGE_FAILED, audits.get(0).getAction());
    }

    @Test
    void testPasswordMismatch() throws Exception {
        String token = jwtService.generateToken(testUser);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("NewPassword123!")
                .confirmPassword("Different123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Passwords do not match")));
    }

    @Test
    void testReuseCurrentPassword() throws Exception {
        String token = jwtService.generateToken(testUser);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("OldPassword123!")
                .confirmPassword("OldPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Cannot reuse any of your last 5 passwords")));
    }

    @Test
    void testReuseOneOfLast5Passwords() throws Exception {
        String token = jwtService.generateToken(testUser);

        // We simulate saving a past password to history
        passwordHistoryRepository.save(com.greenlife.entity.PasswordHistory.builder()
                .user(testUser)
                .passwordHash(passwordEncoder.encode("PastPassword123!"))
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("PastPassword123!")
                .confirmPassword("PastPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Cannot reuse any of your last 5 passwords")));
    }

    @Test
    void testOtpResetPasswordReuse() throws Exception {
        // Generate password reset OTP
        String otp = otpService.createPasswordResetOtp(testUser);

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email(testEmail)
                .otp(otp)
                .newPassword("OldPassword123!")
                .confirmPassword("OldPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Cannot reuse any of your last 5 passwords")));
    }

    @Test
    void testSessionInvalidationAfterPasswordChange() throws Exception {
        // Create an active token in repository
        com.greenlife.entity.RefreshToken rfToken = com.greenlife.entity.RefreshToken.builder()
                .user(testUser)
                .tokenHash("some-token-hash-xyz")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rfToken);

        String token = jwtService.generateToken(testUser);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verify all user tokens are now revoked
        var tokenFromDb = refreshTokenRepository.findById(rfToken.getId()).orElseThrow();
        assertTrue(tokenFromDb.getRevoked());
    }

    @Test
    void testSessionInvalidationAfterPasswordReset() throws Exception {
        com.greenlife.entity.RefreshToken rfToken = com.greenlife.entity.RefreshToken.builder()
                .user(testUser)
                .tokenHash("some-token-hash-abc")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rfToken);

        String otp = otpService.createPasswordResetOtp(testUser);

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email(testEmail)
                .otp(otp)
                .newPassword("BrandNewPassword123!")
                .confirmPassword("BrandNewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        var tokenFromDb = refreshTokenRepository.findById(rfToken.getId()).orElseThrow();
        assertTrue(tokenFromDb.getRevoked());
    }

    @Test
    void testPasswordHistoryRetentionLimit() throws Exception {
        // Save 6 old passwords to history
        for (int i = 1; i <= 6; i++) {
            passwordHistoryRepository.save(com.greenlife.entity.PasswordHistory.builder()
                    .user(testUser)
                    .passwordHash(passwordEncoder.encode("PasswordNumber" + i))
                    .createdAt(LocalDateTime.now().minusHours(i))
                    .build());
        }

        String token = jwtService.generateToken(testUser);
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("NewUniquePassword123!")
                .confirmPassword("NewUniquePassword123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Since we had 6 and added 1 (which makes 7), but retention keeps only newest 5, it should keep exactly 5 entries
        var histories = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertEquals(5, histories.size());
    }

    @Test
    void testUnauthorizedAccessToChangePassword() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("NewPassword123!")
                .confirmPassword("NewPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
