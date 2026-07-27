package com.greenlife;

import com.greenlife.common.dto.MessageResponse;
import com.greenlife.common.service.EmailService;
import com.greenlife.auth.dto.*;
import com.greenlife.auth.entity.*;
import com.greenlife.auth.entity.enums.*;
import com.greenlife.auth.repository.*;
import com.greenlife.auth.service.*;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.exception.*;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.repository.RoleRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootTest
public class AuthOtpIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(AuthOtpIntegrationTest.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserOtpRepository userOtpRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @MockitoBean
    private EmailService emailService;

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
        } catch (Exception e) {
            log.error("Migration setup failed: {}", e.getMessage(), e);
        }

        roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));
    }

    @AfterEach
    void tearDown() {
        // Clean up test data
        userOtpRepository.deleteAll();
        userRepository.findByEmail("test_success@gmail.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("test_fail@gmail.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("test_cooldown@gmail.com").ifPresent(userRepository::delete);
    }

    @Test
    @Transactional
    void testVerifyOtpSuccess() {
        // 1. Register a user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .fullName("Test Success")
                .email("test_success@gmail.com")
                .password("Password123!")
                .phone("0987654321")
                .address("Test Address")
                .role("CUSTOMER")
                .build();

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        
        MessageResponse registerResponse = authService.register(registerRequest);
        assertNotNull(registerResponse);
        assertEquals("Registration successful. Please verify your email.", registerResponse.getMessage());

        // Capture plain OTP sent to EmailService
        verify(emailService).sendVerificationOtp(eq("test_success@gmail.com"), otpCaptor.capture());
        String plainOtp = otpCaptor.getValue();
        assertNotNull(plainOtp);

        // Verify user is PENDING_VERIFICATION and emailVerified is false
        User user = userRepository.findByEmail("test_success@gmail.com").orElseThrow();
        assertEquals(UserStatus.PENDING_VERIFICATION, user.getStatus());
        assertFalse(user.getEmailVerified());

        // 2. Verify with captured OTP
        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("test_success@gmail.com")
                .otp(plainOtp)
                .build();

        MessageResponse verifyResponse = authService.verifyOtp(verifyRequest);
        assertEquals("Email verified successfully", verifyResponse.getMessage());

        // 3. Verify user status became ACTIVE and emailVerified became true
        User verifiedUser = userRepository.findByEmail("test_success@gmail.com").orElseThrow();
        assertEquals(UserStatus.ACTIVE, verifiedUser.getStatus());
        assertTrue(verifiedUser.getEmailVerified());

        // 4. Verify OTP record is completely deleted
        Optional<UserOtp> otpAfterSuccess = userOtpRepository.findByUserAndPurpose(verifiedUser, OtpPurpose.VERIFICATION);
        assertTrue(otpAfterSuccess.isEmpty());
    }

    @Test
    @Transactional
    void testVerifyOtpInvalidThreeTimes() {
        // 1. Register a user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .fullName("Test Fail")
                .email("test_fail@gmail.com")
                .password("Password123!")
                .phone("0987654321")
                .address("Test Address")
                .role("CUSTOMER")
                .build();

        authService.register(registerRequest);

        // 2. Try verifying with wrong OTP three times
        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("test_fail@gmail.com")
                .otp("000000") // Wrong OTP
                .build();

        // Attempt 1: Expect OtpInvalidException
        assertThrows(OtpInvalidException.class, () -> authService.verifyOtp(verifyRequest));

        // Attempt 2: Expect OtpInvalidException
        assertThrows(OtpInvalidException.class, () -> authService.verifyOtp(verifyRequest));

        // Attempt 3: Expect OtpAttemptsExceededException
        assertThrows(OtpAttemptsExceededException.class, () -> authService.verifyOtp(verifyRequest));

        // 3. Verify that OTP record is deleted completely
        User user = userRepository.findByEmail("test_fail@gmail.com").orElseThrow();
        Optional<UserOtp> otpAfterExceeded = userOtpRepository.findByUserAndPurpose(user, OtpPurpose.VERIFICATION);
        assertTrue(otpAfterExceeded.isEmpty());
    }

    @Test
    @Transactional
    void testResendOtpWithinCooldownWindow() {
        // 1. Register a user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .fullName("Test Cooldown")
                .email("test_cooldown@gmail.com")
                .password("Password123!")
                .phone("0987654321")
                .address("Test Address")
                .role("CUSTOMER")
                .build();

        authService.register(registerRequest);

        // 2. Call resend OTP immediately (cooldown is 60 seconds)
        ResendOtpRequest resendRequest = ResendOtpRequest.builder()
                .email("test_cooldown@gmail.com")
                .build();

        // Expect OtpRateLimitException
        assertThrows(OtpRateLimitException.class, () -> authService.resendOtp(resendRequest));
    }
}
