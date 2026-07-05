package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.auth.dto.LoginRequest;
import com.greenlife.auth.entity.RefreshToken;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.auth.repository.RefreshTokenRepository;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.security.JwtBlacklistService;
import com.greenlife.security.JwtService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class JwtBlacklistIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    // Mock Redis template to simulate Redis success/failure
    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtBlacklistService jwtBlacklistService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Role customerRole;
    private final String testEmail = "blacklist_test@gmail.com";

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);

        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        testUser = User.builder()
                .fullName("Blacklist Test User")
                .email(testEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
        testUser = userRepository.save(testUser);

        // Setup default mock behaviors for redisTemplate to behave like it is empty
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valOps = Mockito.mock(ValueOperations.class);
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valOps);
        Mockito.when(redisTemplate.hasKey(Mockito.anyString())).thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        refreshTokenRepository.deleteAll();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);
    }

    @Test
    void testBlacklistedTokenRejected() throws Exception {
        // 1. Log in to get standard access token
        LoginRequest loginRequest = LoginRequest.builder()
                .email(testEmail)
                .password("Password123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseBody).get("accessToken").asText();
        Cookie refreshTokenCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(accessToken);
        assertNotNull(refreshTokenCookie);

        // 2. Mock redisTemplate to simulate that token is blacklisted
        Mockito.when(redisTemplate.hasKey(Mockito.anyString())).thenReturn(true);

        // 3. Request protected endpoint with blacklisted token
        mockMvc.perform(get("/api/stores/my")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Unauthorized")))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testLogoutWithoutAuthorizationHeader() throws Exception {
        // 1. Log in
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

        // 2. Perform logout WITHOUT Authorization header
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(refreshTokenCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Logged out successfully")));

        // 3. Verify refresh token is still revoked in database
        String hashed = hashToken(refreshTokenCookie.getValue());
        Optional<RefreshToken> tokenInDb = refreshTokenRepository.findByTokenHash(hashed);
        assertTrue(tokenInDb.isPresent());
        assertTrue(tokenInDb.get().getRevoked());
    }

    @Test
    void testRefreshTokenRevokedWhenAccessTokenMissing() throws Exception {
        // Explicitly tests that when Authorization header is missing, the refresh token is still successfully revoked
        String rawToken = "raw_refresh_token_to_revoke";
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(testUser)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        Cookie cookie = new Cookie("refreshToken", rawToken);

        // Perform logout with no auth header
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Logged out successfully")));

        // Verify it was revoked
        Optional<RefreshToken> tokenInDb = refreshTokenRepository.findByTokenHash(tokenHash);
        assertTrue(tokenInDb.isPresent());
        assertTrue(tokenInDb.get().getRevoked());
    }

    @Test
    void testRedisUnavailableFallback() {
        // Generate a token
        String token = jwtService.generateToken(testUser);

        // 1. Configure redisTemplate to throw a Connection Failure Exception during write/read
        Mockito.when(redisTemplate.opsForValue()).thenThrow(new RedisConnectionFailureException("Redis connection failed"));
        Mockito.when(redisTemplate.hasKey(Mockito.anyString())).thenThrow(new RedisConnectionFailureException("Redis connection failed"));

        // 2. Verify blacklisting token doesn't throw exception, but logs WARN and falls back to in-memory
        assertDoesNotThrow(() -> jwtBlacklistService.blacklistToken(token));

        // 3. Verify that checking if token is blacklisted checks the in-memory cache and returns true
        assertTrue(jwtBlacklistService.isBlacklisted(token));
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
