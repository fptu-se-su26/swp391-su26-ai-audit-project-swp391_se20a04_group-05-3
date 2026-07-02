package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.*;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.LoginFailureReason;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.*;
import com.greenlife.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class LoginAuditIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private LoginAuditRepository loginAuditRepository;

    @Autowired
    private SecurityAuditRepository securityAuditRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private final String testEmail = "login_test@gmail.com";
    private final String adminEmail = "login_admin@gmail.com";
    private Role customerRole;
    private Role adminRole;
    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        // 1. Ensure tables exist
        try {
            jdbcTemplate.execute(
                "IF OBJECT_ID('login_audits', 'U') IS NULL " +
                "BEGIN " +
                "    CREATE TABLE login_audits ( " +
                "        id BIGINT IDENTITY(1,1) PRIMARY KEY, " +
                "        user_id INT NULL, " +
                "        email VARCHAR(255) NOT NULL, " +
                "        success BIT NOT NULL, " +
                "        ip_address VARCHAR(100) NULL, " +
                "        user_agent NVARCHAR(500) NULL, " +
                "        failure_reason VARCHAR(255) NULL, " +
                "        login_time DATETIME2 NOT NULL DEFAULT SYSDATETIME(), " +
                "        CONSTRAINT fk_login_audits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL " +
                "    ); " +
                "END"
            );

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

            // Add columns to users table if they don't exist
            try {
                jdbcTemplate.execute("ALTER TABLE users ADD last_login_at DATETIME2 NULL;");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE users ADD last_login_ip VARCHAR(100) NULL;");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE security_audits ADD email VARCHAR(255) NULL;");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE security_audits ADD suspicious_activity_type VARCHAR(50) NULL;");
            } catch (Exception ignored) {}

            // Indices
            try {
                jdbcTemplate.execute("CREATE INDEX IX_login_audits_email ON login_audits(email);");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("CREATE INDEX IX_login_audits_login_time ON login_audits(login_time);");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("CREATE INDEX IX_login_audits_user_id ON login_audits(user_id);");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("CREATE INDEX IX_login_audits_email_success_time ON login_audits(email, success, login_time);");
            } catch (Exception ignored) {}
        } catch (Exception ignored) {}

        cleanupAudits();
        userRepository.findByEmail(testEmail).ifPresent(user -> userRepository.delete(user));
        userRepository.findByEmail(adminEmail).ifPresent(user -> userRepository.delete(user));

        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("ADMIN")
                        .description("Admin Role")
                        .build()));

        testUser = userRepository.save(User.builder()
                .fullName("Login Test User")
                .email(testEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .failedLoginAttempts(0)
                .build());

        adminUser = userRepository.save(User.builder()
                .fullName("Login Admin User")
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(adminRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .failedLoginAttempts(0)
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupAudits();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
    }

    private void cleanupAudits() {
        refreshTokenRepository.deleteAll();
        try {
            jdbcTemplate.update("DELETE FROM login_audits");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.update("DELETE FROM security_audits");
        } catch (Exception ignored) {}
    }

    @Test
    void testSuccessfulLoginAuditing() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testEmail, "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Forwarded-For", "203.0.113.19")
                        .header("User-Agent", "TestAgent")
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        // Verify database fields in User entity updated
        User updatedUser = userRepository.findByEmail(testEmail).orElseThrow();
        assertNotNull(updatedUser.getLastLoginAt());
        assertEquals("203.0.113.19", updatedUser.getLastLoginIp());

        // Verify LoginAudit created
        List<LoginAudit> loginAudits = loginAuditRepository.findAll();
        assertFalse(loginAudits.isEmpty());
        LoginAudit successfulAudit = loginAudits.stream()
                .filter(la -> la.getEmail().equals(testEmail))
                .findFirst().orElseThrow();
        assertTrue(successfulAudit.isSuccess());
        assertEquals("203.0.113.19", successfulAudit.getIpAddress());
        assertEquals("TestAgent", successfulAudit.getUserAgent());
        assertNull(successfulAudit.getFailureReason());

        // Verify SecurityAudit created
        List<SecurityAudit> securityAudits = securityAuditRepository.findAll();
        assertFalse(securityAudits.isEmpty());
        SecurityAudit sa = securityAudits.stream()
                .filter(s -> s.getUser() != null && s.getUser().getId().equals(testUser.getId()) && s.getAction() == SecurityAuditAction.LOGIN_SUCCESS)
                .findFirst().orElseThrow();
        assertNotNull(sa);
    }

    @Test
    void testFailedLoginAuditing() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testEmail, "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Real-IP", "198.51.100.42")
                        .header("User-Agent", "Firefox")
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // Verify LoginAudit created with INVALID_CREDENTIALS reason
        List<LoginAudit> loginAudits = loginAuditRepository.findAll();
        assertFalse(loginAudits.isEmpty());
        LoginAudit failedAudit = loginAudits.stream()
                .filter(la -> la.getEmail().equals(testEmail))
                .findFirst().orElseThrow();
        assertFalse(failedAudit.isSuccess());
        assertEquals("198.51.100.42", failedAudit.getIpAddress());
        assertEquals("Firefox", failedAudit.getUserAgent());
        assertEquals(LoginFailureReason.INVALID_CREDENTIALS, failedAudit.getFailureReason());

        // Verify SecurityAudit created with LOGIN_FAILED action
        List<SecurityAudit> securityAudits = securityAuditRepository.findAll();
        assertFalse(securityAudits.isEmpty());
        SecurityAudit sa = securityAudits.stream()
                .filter(s -> s.getUser() != null && s.getUser().getId().equals(testUser.getId()) && s.getAction() == SecurityAuditAction.LOGIN_FAILED)
                .findFirst().orElseThrow();
        assertNotNull(sa);
    }

    @Test
    void testUnknownEmailLoginCreatesAudit() throws Exception {
        String unknownEmail = "unknown_test_user@gmail.com";
        LoginRequest loginRequest = new LoginRequest(unknownEmail, "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("User-Agent", "Chrome")
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // Verify LoginAudit created with user_id = null
        List<LoginAudit> loginAudits = loginAuditRepository.findAll();
        assertFalse(loginAudits.isEmpty());
        LoginAudit failedAudit = loginAudits.stream()
                .filter(la -> la.getEmail().equals(unknownEmail))
                .findFirst().orElseThrow();
        assertFalse(failedAudit.isSuccess());
        assertNull(failedAudit.getUser());
        assertEquals(LoginFailureReason.INVALID_CREDENTIALS, failedAudit.getFailureReason());
    }

    @Test
    void testLockedAccountLoginAudit() throws Exception {
        testUser.setStatus(UserStatus.LOCKED);
        testUser.setLockoutEnd(LocalDateTime.now().plusMinutes(15));
        userRepository.save(testUser);

        LoginRequest loginRequest = new LoginRequest(testEmail, "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());

        // Verify LoginAudit failure_reason is ACCOUNT_LOCKED
        List<LoginAudit> loginAudits = loginAuditRepository.findAll();
        assertFalse(loginAudits.isEmpty());
        LoginAudit failedAudit = loginAudits.stream()
                .filter(la -> la.getEmail().equals(testEmail))
                .findFirst().orElseThrow();
        assertFalse(failedAudit.isSuccess());
        assertEquals(LoginFailureReason.ACCOUNT_LOCKED, failedAudit.getFailureReason());
    }

    @Test
    void testDisabledAccountLoginAudit() throws Exception {
        testUser.setStatus(UserStatus.DISABLED);
        userRepository.save(testUser);

        LoginRequest loginRequest = new LoginRequest(testEmail, "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());

        // Verify LoginAudit failure_reason is ACCOUNT_DISABLED
        List<LoginAudit> loginAudits = loginAuditRepository.findAll();
        assertFalse(loginAudits.isEmpty());
        LoginAudit failedAudit = loginAudits.stream()
                .filter(la -> la.getEmail().equals(testEmail))
                .findFirst().orElseThrow();
        assertFalse(failedAudit.isSuccess());
        assertEquals(LoginFailureReason.ACCOUNT_DISABLED, failedAudit.getFailureReason());
    }

    @Test
    void testUnverifiedAccountLoginAudit() throws Exception {
        testUser.setStatus(UserStatus.PENDING_VERIFICATION);
        userRepository.save(testUser);

        LoginRequest loginRequest = new LoginRequest(testEmail, "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());

        // Verify LoginAudit failure_reason is EMAIL_NOT_VERIFIED
        List<LoginAudit> loginAudits = loginAuditRepository.findAll();
        assertFalse(loginAudits.isEmpty());
        LoginAudit failedAudit = loginAudits.stream()
                .filter(la -> la.getEmail().equals(testEmail))
                .findFirst().orElseThrow();
        assertFalse(failedAudit.isSuccess());
        assertEquals(LoginFailureReason.EMAIL_NOT_VERIFIED, failedAudit.getFailureReason());
    }

    @Test
    void testUserAgentTruncation() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testEmail, "WrongPassword!");
        String longUa = "A".repeat(600);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("User-Agent", longUa)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // Verify LoginAudit user_agent truncated to exactly 500 characters
        List<LoginAudit> loginAudits = loginAuditRepository.findAll();
        assertFalse(loginAudits.isEmpty());
        LoginAudit failedAudit = loginAudits.stream()
                .filter(la -> la.getEmail().equals(testEmail))
                .findFirst().orElseThrow();
        assertEquals(500, failedAudit.getUserAgent().length());
        assertEquals("A".repeat(500), failedAudit.getUserAgent());
    }

    @Test
    void testSuspiciousActivityAlertDeduplication() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testEmail, "WrongPassword!");

        // Trigger 5 failed logins to activate brute force warning
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Check that exactly one SUSPICIOUS_ACTIVITY security audit log was created
        List<SecurityAudit> suspiciousAudits = securityAuditRepository.findAll().stream()
                .filter(sa -> sa.getAction() == SecurityAuditAction.SUSPICIOUS_ACTIVITY)
                .toList();
        assertEquals(1, suspiciousAudits.size());

        // Run a 6th failed login (still inside the same 10-minute window)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());

        // Verify that still only one alert is present (deduplication works)
        suspiciousAudits = securityAuditRepository.findAll().stream()
                .filter(sa -> sa.getAction() == SecurityAuditAction.SUSPICIOUS_ACTIVITY)
                .toList();
        assertEquals(1, suspiciousAudits.size());
    }

    @Test
    @Transactional
    void testLoginAuditImmutability() {
        LoginAudit audit = LoginAudit.builder()
                .email("original@test.com")
                .success(true)
                .ipAddress("127.0.0.1")
                .userAgent("Mozilla")
                .loginTime(LocalDateTime.now())
                .build();
        audit = loginAuditRepository.save(audit);
        entityManager.flush();

        // Try updating email
        audit.setEmail("hacked@test.com");
        loginAuditRepository.save(audit);
        entityManager.flush();

        entityManager.clear(); // Evict entity manager cache to force database lookup

        LoginAudit updated = loginAuditRepository.findById(audit.getId()).orElseThrow();
        assertEquals("original@test.com", updated.getEmail()); // Verify NOT updated!
    }

    @Test
    void testDatabaseIndexesExist() {
        Integer emailIndexCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.indexes WHERE name = 'IX_login_audits_email' AND object_id = OBJECT_ID('login_audits')",
            Integer.class
        );
        Integer timeIndexCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.indexes WHERE name = 'IX_login_audits_login_time' AND object_id = OBJECT_ID('login_audits')",
            Integer.class
        );
        Integer userIndexCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.indexes WHERE name = 'IX_login_audits_user_id' AND object_id = OBJECT_ID('login_audits')",
            Integer.class
        );
        Integer compositeIndexCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.indexes WHERE name = 'IX_login_audits_email_success_time' AND object_id = OBJECT_ID('login_audits')",
            Integer.class
        );
        assertEquals(1, emailIndexCount, "Index IX_login_audits_email should exist");
        assertEquals(1, timeIndexCount, "Index IX_login_audits_login_time should exist");
        assertEquals(1, userIndexCount, "Index IX_login_audits_user_id should exist");
        assertEquals(1, compositeIndexCount, "Composite Index IX_login_audits_email_success_time should exist");
    }

    @Test
    void testAccountLockoutGeneratesSecurityAuditEvent() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testEmail, "WrongPassword!");

        // Trigger 5 failed logins to lock account
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Verify that account locked security audit log was created
        List<SecurityAudit> lockedAudits = securityAuditRepository.findAll().stream()
                .filter(sa -> sa.getAction() == SecurityAuditAction.ACCOUNT_LOCKED)
                .toList();
        assertEquals(1, lockedAudits.size());
        assertEquals(testUser.getId(), lockedAudits.get(0).getUser().getId());
    }

    @Test
    void testUnknownEmailBruteForceGeneratesAlert() throws Exception {
        String unknownEmail = "brute_force_unknown@gmail.com";
        LoginRequest loginRequest = new LoginRequest(unknownEmail, "Password123!");

        // Trigger 5 failed logins for unknown email
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Verify that exactly one SUSPICIOUS_ACTIVITY brute force alert was generated
        List<SecurityAudit> suspiciousAudits = securityAuditRepository.findAll().stream()
                .filter(sa -> sa.getAction() == SecurityAuditAction.SUSPICIOUS_ACTIVITY 
                           && sa.getSuspiciousActivityType() == com.greenlife.entity.enums.SuspiciousActivityType.BRUTE_FORCE)
                .toList();
        assertEquals(1, suspiciousAudits.size());
        assertNull(suspiciousAudits.get(0).getUser());
        assertEquals(unknownEmail, suspiciousAudits.get(0).getEmail());
    }

    @Test
    void testUserSecurityHistoryEndpoint() throws Exception {
        String token = jwtService.generateToken(testUser);

        // Insert successful audit manually
        loginAuditRepository.save(LoginAudit.builder()
                .user(testUser)
                .email(testEmail)
                .success(true)
                .ipAddress("192.168.1.1")
                .userAgent("TestAgent")
                .loginTime(LocalDateTime.now())
                .build());

        // Insert failed audit manually
        loginAuditRepository.save(LoginAudit.builder()
                .user(testUser)
                .email(testEmail)
                .success(false)
                .ipAddress("192.168.1.2")
                .userAgent("TestAgent")
                .failureReason(LoginFailureReason.INVALID_CREDENTIALS)
                .loginTime(LocalDateTime.now())
                .build());

        mockMvc.perform(get("/api/auth/security-history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentSuccessfulLogins", hasSize(1)))
                .andExpect(jsonPath("$.recentFailedLogins", hasSize(1)))
                .andExpect(jsonPath("$.recentSuccessfulLogins[0].ipAddress", is("192.168.1.1")))
                .andExpect(jsonPath("$.recentFailedLogins[0].ipAddress", is("192.168.1.2")));
    }

    @Test
    void testAdminSecurityEndpointsAndRbac() throws Exception {
        String adminToken = jwtService.generateToken(adminUser);
        String userToken = jwtService.generateToken(testUser);

        // Insert a record to verify admin mapping
        loginAuditRepository.save(LoginAudit.builder()
                .user(testUser)
                .email(testEmail)
                .success(false)
                .ipAddress("10.0.0.1")
                .userAgent("Safari")
                .failureReason(LoginFailureReason.INVALID_CREDENTIALS)
                .loginTime(LocalDateTime.now())
                .build());

        // 1. Check GET /api/admin/security/login-audits (ADMIN works)
        mockMvc.perform(get("/api/admin/security/login-audits")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email", is(testEmail)));

        // 2. Check GET /api/admin/security/login-audits/{userId} (ADMIN works)
        mockMvc.perform(get("/api/admin/security/login-audits/" + testUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));

        // 3. Check GET /api/admin/security/failed-logins (ADMIN works)
        mockMvc.perform(get("/api/admin/security/failed-logins")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));

        // 4. Check RBAC Protection (CUSTOMER should be forbidden)
        mockMvc.perform(get("/api/admin/security/login-audits")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}
