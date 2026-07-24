package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.auth.dto.LoginRequest;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.auth.repository.RefreshTokenRepository;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthLockoutIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(AuthLockoutIntegrationTest.class);

    @Autowired
    private MockMvc mockMvc;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Role customerRole;
    private final String testEmail = "lockout_test@gmail.com";

    @BeforeEach
    void setUp() {
        // Dynamic DDL migration run to ensure test database is consistent
        try {
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'failed_login_attempts') " +
                    "ALTER TABLE users ADD failed_login_attempts INT NOT NULL DEFAULT 0;");
            
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'lockout_end') " +
                    "ALTER TABLE users ADD lockout_end DATETIME2 NULL;");

            jdbcTemplate.execute("IF OBJECT_ID('user_otps', 'U') IS NULL " +
                    "CREATE TABLE user_otps (" +
                    "id BIGINT IDENTITY(1,1) PRIMARY KEY," +
                    "user_id INT NOT NULL," +
                    "otp_hash VARCHAR(64) NOT NULL," +
                    "purpose VARCHAR(30) NOT NULL DEFAULT 'VERIFICATION'," +
                    "attempts INT NOT NULL DEFAULT 0," +
                    "expires_at DATETIME2 NOT NULL," +
                    "created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()," +
                    "CONSTRAINT fk_otps_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE," +
                    "CONSTRAINT chk_otps_purpose CHECK (purpose IN ('VERIFICATION', 'PASSWORD_RESET', 'SELLER_REGISTRATION'))" +
                    ");");

            jdbcTemplate.execute("IF OBJECT_ID('refresh_tokens', 'U') IS NULL " +
                    "CREATE TABLE refresh_tokens (" +
                    "id BIGINT IDENTITY(1,1) PRIMARY KEY," +
                    "user_id INT NOT NULL," +
                    "token_hash VARCHAR(64) NOT NULL," +
                    "expires_at DATETIME2 NOT NULL," +
                    "revoked BIT NOT NULL DEFAULT 0," +
                    "created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()," +
                    "CONSTRAINT fk_refresh_tokens_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                    ");");

            // Ensure security_audits exists
            jdbcTemplate.execute(
                "IF OBJECT_ID('security_audits', 'U') IS NULL " +
                "BEGIN " +
                "    CREATE TABLE security_audits ( " +
                "        id BIGINT IDENTITY(1,1) PRIMARY KEY, " +
                "        user_id INT NULL, " +
                "        email VARCHAR(255) NULL, " +
                "        action VARCHAR(50) NOT NULL, " +
                "        suspicious_activity_type VARCHAR(50) NULL, " +
                "        details NVARCHAR(500) NULL, " +
                "        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), " +
                "        CONSTRAINT fk_security_audits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL " +
                "    ); " +
                "END"
            );
        } catch (Exception e) {
            log.error("Migration setup failed: {}", e.getMessage(), e);
        }

        refreshTokenRepository.deleteAll();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);

        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));
    }

    @AfterEach
    void tearDown() {
        refreshTokenRepository.deleteAll();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);
    }

    private User createTestUser(UserStatus status, int failedAttempts, LocalDateTime lockoutEnd) {
        return userRepository.save(User.builder()
                .fullName("Lockout Test User")
                .email(testEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(status)
                .emailVerified(status == UserStatus.ACTIVE || status == UserStatus.DISABLED || status == UserStatus.LOCKED)
                .failedLoginAttempts(failedAttempts)
                .lockoutEnd(lockoutEnd)
                .build());
    }

    @Test
    void testFailedLoginsTriggerLock() throws Exception {
        createTestUser(UserStatus.ACTIVE, 0, null);

        LoginRequest wrongRequest = LoginRequest.builder()
                .email(testEmail)
                .password("WrongPassword123!")
                .build();

        // Perform 4 failed login attempts
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongRequest)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error", containsString("Email hoặc mật khẩu không chính xác")));
        }

        // Assert 4 attempts recorded
        User userAfter4 = userRepository.findByEmail(testEmail).orElseThrow();
        assertEquals(4, userAfter4.getFailedLoginAttempts());
        assertEquals(UserStatus.ACTIVE, userAfter4.getStatus());

        // Perform the 5th failed attempt
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongRequest)))
                .andExpect(status().isUnauthorized());

        // Assert account is now LOCKED
        User userLocked = userRepository.findByEmail(testEmail).orElseThrow();
        assertEquals(5, userLocked.getFailedLoginAttempts());
        assertEquals(UserStatus.LOCKED, userLocked.getStatus());
        assertNotNull(userLocked.getLockoutEnd());
        assertTrue(userLocked.getLockoutEnd().isAfter(LocalDateTime.now()));
    }

    @Test
    void testLockedUserCannotLogin() throws Exception {
        createTestUser(UserStatus.LOCKED, 5, LocalDateTime.now().plusMinutes(30));

        LoginRequest request = LoginRequest.builder()
                .email(testEmail)
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsString("Tài khoản của bạn đã bị khóa. Vui lòng thử lại sau")));
    }

    @Test
    void testExpiredLockAutomaticallyUnlocks() throws Exception {
        createTestUser(UserStatus.LOCKED, 5, LocalDateTime.now().minusMinutes(5));

        LoginRequest request = LoginRequest.builder()
                .email(testEmail)
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());

        // Verify state is ACTIVE and reset in database
        User user = userRepository.findByEmail(testEmail).orElseThrow();
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals(0, user.getFailedLoginAttempts());
        assertNull(user.getLockoutEnd());
    }

    @Test
    void testSuccessfulLoginResetsCounter() throws Exception {
        createTestUser(UserStatus.ACTIVE, 3, null);

        LoginRequest request = LoginRequest.builder()
                .email(testEmail)
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        User user = userRepository.findByEmail(testEmail).orElseThrow();
        assertEquals(0, user.getFailedLoginAttempts());
        assertNull(user.getLockoutEnd());
        assertEquals(UserStatus.ACTIVE, user.getStatus());
    }

    @Test
    void testDisabledAccountRejected() throws Exception {
        createTestUser(UserStatus.DISABLED, 0, null);

        LoginRequest request = LoginRequest.builder()
                .email(testEmail)
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsString("Tài khoản đã bị vô hiệu hóa")));
    }

    @Test
    void testUnverifiedAccountRejected() throws Exception {
        createTestUser(UserStatus.PENDING_VERIFICATION, 0, null);

        LoginRequest request = LoginRequest.builder()
                .email(testEmail)
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Tài khoản chưa được xác thực email")));
    }
}
