package com.greenlife.auth.service;

import com.greenlife.auth.dto.*;
import com.greenlife.auth.entity.RefreshToken;
import com.greenlife.auth.repository.*;
import com.greenlife.common.dto.MessageResponse;
import com.greenlife.common.service.EmailService;
import com.greenlife.exception.CustomException;
import com.greenlife.security.JwtBlacklistService;
import com.greenlife.security.JwtService;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private OtpService otpService;
    @Mock private EmailService emailService;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordHistoryRepository passwordHistoryRepository;
    @Mock private SecurityAuditRepository securityAuditRepository;
    @Mock private LoginAuditRepository loginAuditRepository;
    @Mock private SecurityAuditService securityAuditService;
    @Mock private SecurityMonitoringService securityMonitoringService;
    @Mock private JwtBlacklistService jwtBlacklistService;
    @Mock private TransactionTemplate transactionTemplate;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                roleRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                otpService,
                emailService,
                refreshTokenRepository,
                passwordHistoryRepository,
                securityAuditRepository,
                loginAuditRepository,
                securityAuditService,
                securityMonitoringService,
                jwtBlacklistService,
                transactionTemplate
        );

        // Stub transactionTemplate to execute callbacks immediately
        lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(mock(TransactionStatus.class));
        });
    }

    @Test
    void testRegisterPropagatesSmtpFailure() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@example.com");
        request.setPassword("Password123");
        request.setFullName("New User");
        request.setRole("CUSTOMER");

        Role customerRole = new Role();
        customerRole.setName("CUSTOMER");

        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("Password123")).thenReturn("hashedPassword");

        User savedUser = User.builder()
                .id(1)
                .email("newuser@example.com")
                .fullName("New User")
                .role(customerRole)
                .status(UserStatus.PENDING_VERIFICATION)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(otpService.createVerificationOtp(any(User.class))).thenReturn("123456");

        // Simulate SMTP failure
        doThrow(new CustomException("SMTP failure", HttpStatus.SERVICE_UNAVAILABLE))
                .when(emailService).sendVerificationOtp("newuser@example.com", "123456");

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () ->
                authService.register(request)
        );
        assertEquals("SMTP failure", exception.getMessage());
        assertEquals(503, exception.getStatus().value());
    }

    @Test
    void testForgotPasswordSwallowsSmtpFailure() {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("existing@example.com");

        User existingUser = User.builder()
                .id(2)
                .email("existing@example.com")
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(existingUser));
        when(otpService.createPasswordResetOtp(existingUser)).thenReturn("654321");

        // Simulate SMTP failure
        doThrow(new CustomException("SMTP failure", HttpStatus.SERVICE_UNAVAILABLE))
                .when(emailService).sendPasswordResetOtp("existing@example.com", "654321");

        // Act & Assert
        MessageResponse response = assertDoesNotThrow(() ->
                authService.forgotPassword(request)
        );
        assertNotNull(response);
        assertEquals("If the account exists, a password reset OTP has been sent", response.getMessage());
    }
}
