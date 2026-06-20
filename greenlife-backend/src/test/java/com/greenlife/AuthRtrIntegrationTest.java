package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.LoginRequest;
import com.greenlife.entity.RefreshToken;
import com.greenlife.entity.Role;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.RefreshTokenRepository;
import com.greenlife.repository.RoleRepository;
import com.greenlife.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthRtrIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @org.springframework.boot.test.mock.mockito.MockBean
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

    private User testUser;
    private Role customerRole;

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
                    "CONSTRAINT chk_otps_purpose CHECK (purpose IN ('VERIFICATION', 'PASSWORD_RESET'))" +
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
            System.err.println("Migration setup failed: " + e.getMessage());
        }

        refreshTokenRepository.deleteAll();
        userRepository.findByEmail("rtr_test@gmail.com").ifPresent(userRepository::delete);

        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        testUser = User.builder()
                .fullName("RTR Test User")
                .email("rtr_test@gmail.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
        testUser = userRepository.save(testUser);
    }

    @AfterEach
    void tearDown() {
        refreshTokenRepository.deleteAll();
        userRepository.findByEmail("rtr_test@gmail.com").ifPresent(userRepository::delete);
    }

    @Test
    void testLoginSuccess() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("rtr_test@gmail.com")
                .password("Password123!")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is("rtr_test@gmail.com")))
                .andReturn();

        Cookie refreshTokenCookie = result.getResponse().getCookie("refreshToken");
        assertNotNull(refreshTokenCookie);
        assertTrue(refreshTokenCookie.isHttpOnly());
        assertEquals("/", refreshTokenCookie.getPath());
        assertFalse(refreshTokenCookie.getSecure()); // secure property should map app.cookie.secure (false in dev/test)
    }

    @Test
    void testRefreshSuccess() throws Exception {
        // 1. Perform login to get refresh token cookie
        LoginRequest loginRequest = LoginRequest.builder()
                .email("rtr_test@gmail.com")
                .password("Password123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshTokenCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshTokenCookie);

        // 2. Perform refresh using the cookie
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshTokenCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is("rtr_test@gmail.com")))
                .andReturn();

        // Check new refresh cookie
        Cookie newCookie = refreshResult.getResponse().getCookie("refreshToken");
        assertNotNull(newCookie);
        assertNotEquals(refreshTokenCookie.getValue(), newCookie.getValue());
    }

    @Test
    void testRefreshExpired() throws Exception {
        // Create an expired refresh token manually
        String rawToken = "expired_raw_token_xyz";
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(testUser)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().minusMinutes(5)) // Expired
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        Cookie cookie = new Cookie("refreshToken", rawToken);

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Refresh token has expired")));
    }

    @Test
    void testRefreshRevoked() throws Exception {
        // Create a revoked token
        String rawToken = "revoked_raw_token_xyz";
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(testUser)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(true) // Revoked
                .build();
        refreshTokenRepository.save(refreshToken);

        Cookie cookie = new Cookie("refreshToken", rawToken);

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Refresh token has been revoked. Reauthentication required.")));
    }

    @Test
    void testLogoutSuccess() throws Exception {
        // 1. Perform login
        LoginRequest loginRequest = LoginRequest.builder()
                .email("rtr_test@gmail.com")
                .password("Password123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshTokenCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshTokenCookie);

        // 2. Logout
        MvcResult logoutResult = mockMvc.perform(post("/api/auth/logout")
                        .cookie(refreshTokenCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Logged out successfully")))
                .andReturn();

        // Check response cookie max-age is 0 (deleted)
        Cookie clearedCookie = logoutResult.getResponse().getCookie("refreshToken");
        assertNotNull(clearedCookie);
        assertEquals(0, clearedCookie.getMaxAge());

        // Check DB token is revoked
        String hashed = hashToken(refreshTokenCookie.getValue());
        Optional<RefreshToken> tokenInDb = refreshTokenRepository.findByTokenHash(hashed);
        assertTrue(tokenInDb.isPresent());
        assertTrue(tokenInDb.get().getRevoked());
    }

    @Test
    void testReplayAttackDetection() throws Exception {
        // Create 2 valid refresh tokens for the same user (representing multiple devices)
        String rawToken1 = "raw_token_1";
        String hash1 = hashToken(rawToken1);
        RefreshToken rt1 = RefreshToken.builder()
                .user(testUser)
                .tokenHash(hash1)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        String rawToken2 = "raw_token_2";
        String hash2 = hashToken(rawToken2);
        RefreshToken rt2 = RefreshToken.builder()
                .user(testUser)
                .tokenHash(hash2)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        refreshTokenRepository.saveAll(List.of(rt1, rt2));

        // Mark rt1 as revoked (simulating it was already used/rotated)
        rt1.setRevoked(true);
        refreshTokenRepository.save(rt1);

        // Now, attempt to reuse the revoked rt1 (Replay Attack)
        Cookie replayCookie = new Cookie("refreshToken", rawToken1);

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(replayCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Refresh token has been revoked. Reauthentication required.")));

        // Both tokens for this user must now be revoked in the database
        Optional<RefreshToken> rt1Db = refreshTokenRepository.findByTokenHash(hash1);
        Optional<RefreshToken> rt2Db = refreshTokenRepository.findByTokenHash(hash2);

        assertTrue(rt1Db.isPresent() && rt1Db.get().getRevoked());
        assertTrue(rt2Db.isPresent() && rt2Db.get().getRevoked());
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
