package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.auth.dto.ResendOtpRequest;
import com.greenlife.auth.dto.VerifyOtpRequest;
import com.greenlife.auth.entity.UserOtp;
import com.greenlife.auth.entity.enums.OtpPurpose;
import com.greenlife.auth.repository.UserOtpRepository;
import com.greenlife.auth.service.AuthService;
import com.greenlife.auth.service.OtpService;
import com.greenlife.common.service.EmailService;
import com.greenlife.exception.CustomException;
import com.greenlife.exception.OtpAttemptsExceededException;
import com.greenlife.exception.OtpExpiredException;
import com.greenlife.exception.OtpInvalidException;
import com.greenlife.exception.OtpRateLimitException;
import com.greenlife.security.JwtService;
import com.greenlife.store.dto.StoreRequest;
import com.greenlife.store.repository.StoreApprovalAuditRepository;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.BeforeAll;

@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
public class SellerOtpIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserOtpRepository userOtpRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private StoreApprovalAuditRepository storeApprovalAuditRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @MockitoBean
    private EmailService emailService;

    private final String activeUserEmail = "active_seller@gmail.com";
    private final String partnerEmail = "partner_store@gmail.com";

    private User activeUser;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        cleanupDatabase();

        activeUser = userRepository.findByEmail(activeUserEmail)
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Active Seller User")
                        .email(activeUserEmail)
                        .passwordHash(passwordEncoder.encode("Password123!"))
                        .role(customerRole)
                        .status(UserStatus.ACTIVE)
                        .emailVerified(true)
                        .build()));
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        userRepository.findByEmail(activeUserEmail).ifPresent(user -> {
            userOtpRepository.deleteAll(userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(user, OtpPurpose.SELLER_REGISTRATION));
            userOtpRepository.deleteAll(userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(user, OtpPurpose.VERIFICATION));
            userOtpRepository.deleteAll(userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(user, OtpPurpose.PASSWORD_RESET));

            var stores = storeRepository.findByOwnerEmail(activeUserEmail);
            for (var s : stores) {
                var audits = storeApprovalAuditRepository.findByStoreId(s.getId());
                storeApprovalAuditRepository.deleteAll(audits);
                storeRepository.delete(s);
            }

            userRepository.delete(user);
        });
    }

    @Test
    void testActiveAuthenticatedUserSendSellerOtpSuccess() throws Exception {
        String token = jwtService.generateToken(activeUser);
        ResendOtpRequest request = ResendOtpRequest.builder().email(partnerEmail).build();

        mockMvc.perform(post("/api/stores/otp/send")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Mã OTP xác thực người bán đã được gửi thành công"));

        verify(emailService, times(1)).sendSellerRegistrationOtp(eq(partnerEmail.toLowerCase()), anyString());

        List<UserOtp> otps = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        assertEquals(1, otps.size());
        assertEquals(activeUser.getId(), otps.get(0).getUser().getId());
    }

    @Test
    void testUnauthenticatedSellerOtpRequestsReturn401() throws Exception {
        ResendOtpRequest sendReq = ResendOtpRequest.builder().email(partnerEmail).build();
        mockMvc.perform(post("/api/stores/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendReq)))
                .andExpect(status().isUnauthorized());

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder().email(partnerEmail).otp("123456").build();
        mockMvc.perform(post("/api/stores/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void testMailSendingFailureRollsBackOtpAndCooldown() {
        doThrow(new CustomException("SMTP Error", HttpStatus.SERVICE_UNAVAILABLE))
                .when(emailService).sendSellerRegistrationOtp(anyString(), anyString());

        ResendOtpRequest request = ResendOtpRequest.builder().email(partnerEmail).build();

        assertThrows(CustomException.class, () -> authService.sendSellerOtp(request, activeUserEmail));

        List<UserOtp> otps = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        assertTrue(otps.isEmpty(), "UserOtp transaction should have rolled back completely on mail failure");
    }

    @Test
    void testSendingNewOtpInvalidatesEarlierActiveOtpOrProofWithoutDeletingHistory() throws Exception {
        String token = jwtService.generateToken(activeUser);

        // First Send
        authService.sendSellerOtp(ResendOtpRequest.builder().email(partnerEmail).build(), activeUserEmail);

        // Manually adjust createdAt to bypass 60s cooldown for testing second send
        List<UserOtp> otps1 = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        UserOtp firstOtp = otps1.get(0);
        firstOtp.setCreatedAt(LocalDateTime.now().minusSeconds(65));
        userOtpRepository.save(firstOtp);

        // Second Send
        authService.sendSellerOtp(ResendOtpRequest.builder().email(partnerEmail).build(), activeUserEmail);

        List<UserOtp> otps2 = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        assertEquals(2, otps2.size(), "History records must be preserved for 10-min rate limit counting");

        UserOtp latest = otps2.get(0);
        UserOtp oldest = otps2.get(1);

        assertTrue(oldest.getExpiresAt().isBefore(LocalDateTime.now()) || oldest.getExpiresAt().isEqual(LocalDateTime.now()), "Earlier OTP must be invalidated via expiresAt");
        assertTrue(latest.getExpiresAt().isAfter(LocalDateTime.now()), "Latest OTP must be active");
    }

    @Test
    void testMaxResendLimitEnforced() {
        // Seed 3 OTPs within last 10 minutes
        for (int i = 0; i < 3; i++) {
            userOtpRepository.save(UserOtp.builder()
                    .user(activeUser)
                    .otpHash(otpService.hashOtp("12345" + i + ":" + partnerEmail.toLowerCase()))
                    .purpose(OtpPurpose.SELLER_REGISTRATION)
                    .expiresAt(LocalDateTime.now().minusMinutes(1))
                    .createdAt(LocalDateTime.now().minusMinutes(5 - i))
                    .build());
        }

        ResendOtpRequest request = ResendOtpRequest.builder().email(partnerEmail).build();
        CustomException ex = assertThrows(CustomException.class, () -> authService.sendSellerOtp(request, activeUserEmail));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
    }

    @Test
    void testResendCooldownEnforced() {
        authService.sendSellerOtp(ResendOtpRequest.builder().email(partnerEmail).build(), activeUserEmail);

        ResendOtpRequest request = ResendOtpRequest.builder().email(partnerEmail).build();
        assertThrows(OtpRateLimitException.class, () -> authService.sendSellerOtp(request, activeUserEmail));
    }

    @Test
    void testVerifySellerOtpWrongEmailFails() {
        authService.sendSellerOtp(ResendOtpRequest.builder().email(partnerEmail).build(), activeUserEmail);
        List<UserOtp> otps = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        assertFalse(otps.isEmpty());

        VerifyOtpRequest wrongEmailReq = VerifyOtpRequest.builder().email("wrong_email@gmail.com").otp("123456").build();
        assertThrows(OtpInvalidException.class, () -> authService.verifySellerOtp(wrongEmailReq, activeUserEmail));
    }

    @Test
    void testVerifySellerOtpExpiredFails() {
        authService.sendSellerOtp(ResendOtpRequest.builder().email(partnerEmail).build(), activeUserEmail);
        List<UserOtp> otps = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        UserOtp otp = otps.get(0);
        otp.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        userOtpRepository.save(otp);

        VerifyOtpRequest req = VerifyOtpRequest.builder().email(partnerEmail).otp("123456").build();
        assertThrows(OtpExpiredException.class, () -> authService.verifySellerOtp(req, activeUserEmail));
    }

    @Test
    void testVerifySellerOtpMaxAttemptsExceeded() {
        authService.sendSellerOtp(ResendOtpRequest.builder().email(partnerEmail).build(), activeUserEmail);

        VerifyOtpRequest wrongReq = VerifyOtpRequest.builder().email(partnerEmail).otp("000000").build();

        assertThrows(OtpInvalidException.class, () -> authService.verifySellerOtp(wrongReq, activeUserEmail));
        assertThrows(OtpInvalidException.class, () -> authService.verifySellerOtp(wrongReq, activeUserEmail));
        assertThrows(OtpAttemptsExceededException.class, () -> authService.verifySellerOtp(wrongReq, activeUserEmail));
    }

    @Test
    void testVerifySellerOtpIdempotent() {
        // Seed plain OTP "654321"
        String plainOtp = "654321";
        String hashedOtp = otpService.hashOtp(plainOtp + ":" + partnerEmail.toLowerCase());
        userOtpRepository.save(UserOtp.builder()
                .user(activeUser)
                .otpHash(hashedOtp)
                .purpose(OtpPurpose.SELLER_REGISTRATION)
                .expiresAt(LocalDateTime.now().plusMinutes(3))
                .createdAt(LocalDateTime.now())
                .build());

        VerifyOtpRequest req = VerifyOtpRequest.builder().email(partnerEmail).otp(plainOtp).build();

        // First verification
        authService.verifySellerOtp(req, activeUserEmail);

        List<UserOtp> otpsAfterFirst = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        UserOtp verifiedProof = otpsAfterFirst.get(0);
        String proofHash = verifiedProof.getOtpHash();
        LocalDateTime expiresAt = verifiedProof.getExpiresAt();

        // Second verification (Idempotent call)
        assertDoesNotThrow(() -> authService.verifySellerOtp(req, activeUserEmail));

        List<UserOtp> otpsAfterSecond = userOtpRepository.findByUserAndPurposeOrderByCreatedAtDesc(activeUser, OtpPurpose.SELLER_REGISTRATION);
        UserOtp proofAfterSecond = otpsAfterSecond.get(0);

        assertEquals(proofHash, proofAfterSecond.getOtpHash(), "Proof hash must remain unchanged");
        assertEquals(expiresAt, proofAfterSecond.getExpiresAt(), "Proof TTL must not be extended on idempotent call");
    }

    @Test
    void testCreateStoreWithoutOtpProofFails() {
        CustomException serviceEx = assertThrows(CustomException.class, () -> otpService.consumeSellerRegistrationOtpProof(activeUser, partnerEmail));
        assertEquals(HttpStatus.BAD_REQUEST, serviceEx.getStatus());
    }

    @Test
    void testCreateStoreWithMismatchedEmailFails() {
        // Seed verified proof for partnerEmail
        String proofHash = otpService.hashOtp("VERIFIED:" + activeUser.getId() + ":" + partnerEmail.toLowerCase());
        userOtpRepository.save(UserOtp.builder()
                .user(activeUser)
                .otpHash(proofHash)
                .purpose(OtpPurpose.SELLER_REGISTRATION)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .createdAt(LocalDateTime.now())
                .build());

        CustomException ex = assertThrows(CustomException.class, () -> otpService.consumeSellerRegistrationOtpProof(activeUser, "different_partner@gmail.com"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void testContextLoads() {
        assertNotNull(authService);
        assertNotNull(otpService);
    }
}
