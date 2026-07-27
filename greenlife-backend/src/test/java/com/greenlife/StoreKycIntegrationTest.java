package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.store.dto.StoreRequest;
import com.greenlife.user.entity.Role;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.store.repository.StoreApprovalAuditRepository;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.auth.repository.UserOtpRepository;
import com.greenlife.security.JwtService;
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

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class StoreKycIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private StoreApprovalAuditRepository storeApprovalAuditRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserOtpRepository userOtpRepository;

    @Autowired
    private com.greenlife.auth.service.OtpService otpService;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    private final String ownerEmail = "kyc_owner@gmail.com";
    private Role ownerRole;
    private User ownerUser;
    
    // Track files to delete after tests
    private final List<String> filesToDelete = new ArrayList<>();

    private final String VALID_PNG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    private final String VALID_WEBP_BASE64 = "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vugAAA=";
    private final String INVALID_GIF_BASE64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    private final String PDF_BASE64 = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nID4+CmVuZG9iagplbmRmaWxlCg==";

    @BeforeEach
    void setUp() {
        ownerRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("STORE_OWNER")
                        .description("Store Owner Role")
                        .build()));

        cleanupDatabase();
        ownerUser = userRepository.save(User.builder()
                .fullName("KYC Owner User")
                .email(ownerEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(ownerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        seedVerifiedProof();
    }

    private void seedVerifiedProof() {
        String proofHash = otpService.hashOtp("VERIFIED:" + ownerUser.getId() + ":" + ownerEmail.toLowerCase());
        userOtpRepository.save(com.greenlife.auth.entity.UserOtp.builder()
                .user(ownerUser)
                .otpHash(proofHash)
                .purpose(com.greenlife.auth.entity.enums.OtpPurpose.SELLER_REGISTRATION)
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(15))
                .createdAt(java.time.LocalDateTime.now())
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
        // Clean up created files
        for (String relativePath : filesToDelete) {
            try {
                String cleanPath = relativePath.startsWith("/uploads/") ? relativePath.substring("/uploads/".length()) : relativePath;
                Path p = Paths.get("./uploads").resolve(cleanPath).toAbsolutePath().normalize();
                File f = p.toFile();
                if (f.exists()) {
                    f.delete();
                }
            } catch (Exception e) {
                // Ignore
            }
        }
        filesToDelete.clear();
    }

    private void cleanupDatabase() {
        userRepository.findByEmail(ownerEmail).ifPresent(owner -> {
            var stores = storeRepository.findByOwnerEmail(ownerEmail);
            for (Store store : stores) {
                var audits = storeApprovalAuditRepository.findByStoreId(store.getId());
                storeApprovalAuditRepository.deleteAll(audits);
                storeRepository.delete(store);
            }
            userRepository.delete(owner);
        });
    }

    private StoreRequest.StoreRequestBuilder createBasicRequest() {
        return StoreRequest.builder()
                .name("KYC Test Store")
                .phone("0987654321")
                .city("Da Nang")
                .district("Hai Chau")
                .address("123 Le Loi")
                .description("Store for testing KYC")
                .logoUrl("http://example.com/logo.png");
    }

    @Test
    void testRegisterWithValidBase64Image() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        StoreRequest request = createBasicRequest()
                .verificationDocument(VALID_PNG_BASE64)
                .build();

        MvcResult result = mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationDocument", startsWith("/uploads/kyc/")))
                .andExpect(jsonPath("$.verificationDocument", endsWith(".png")))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String savedPath = objectMapper.readTree(responseBody).get("verificationDocument").asText();
        filesToDelete.add(savedPath);

        // Verify physical file exists
        Path resolvedPath = Paths.get("./uploads").resolve(savedPath.substring("/uploads/".length())).toAbsolutePath().normalize();
        assertTrue(resolvedPath.toFile().exists(), "Physical file should exist on disk");
    }

    @Test
    void testRegisterWithInvalidBase64() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        StoreRequest request = createBasicRequest()
                .verificationDocument("ThisIsNotValidBase64Content!!!")
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegisterWithOversizedImage() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        
        // Generate bytes exceeding 5MB (5.1MB)
        byte[] oversizedBytes = new byte[5 * 1024 * 1024 + 1024];
        String oversizedBase64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(oversizedBytes);

        StoreRequest request = createBasicRequest()
                .verificationDocument(oversizedBase64)
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("vượt quá giới hạn 5MB")));
    }

    @Test
    void testRegisterWithNonImagePayload() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        
        // Test PDF Base64
        StoreRequest requestPdf = createBasicRequest()
                .verificationDocument(PDF_BASE64)
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestPdf)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Định dạng tệp không được hỗ trợ")));

        // Test GIF (rejected since only PNG, JPEG, WEBP allowed)
        StoreRequest requestGif = createBasicRequest()
                .verificationDocument(INVALID_GIF_BASE64)
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestGif)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUrlCompatibility() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        String normalUrl = "http://example.com/document.pdf";
        
        StoreRequest request = createBasicRequest()
                .verificationDocument(normalUrl)
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationDocument", is(normalUrl)));
    }

    @Test
    void testUpdateDocumentDeletesOldFile() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        
        // 1. Register with first document
        StoreRequest registerRequest = createBasicRequest()
                .verificationDocument(VALID_PNG_BASE64)
                .build();

        MvcResult regResult = mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String regSavedPath = objectMapper.readTree(regResult.getResponse().getContentAsString()).get("verificationDocument").asText();
        filesToDelete.add(regSavedPath);
        Path firstResolvedPath = Paths.get("./uploads").resolve(regSavedPath.substring("/uploads/".length())).toAbsolutePath().normalize();
        assertTrue(firstResolvedPath.toFile().exists(), "First document file should exist");

        // 2. Update profile with second document
        StoreRequest updateRequest = createBasicRequest()
                .verificationDocument(VALID_WEBP_BASE64)
                .build();

        MvcResult updateResult = mockMvc.perform(put("/api/store/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String updateSavedPath = objectMapper.readTree(updateResult.getResponse().getContentAsString()).get("verificationDocument").asText();
        filesToDelete.add(updateSavedPath);
        Path secondResolvedPath = Paths.get("./uploads").resolve(updateSavedPath.substring("/uploads/".length())).toAbsolutePath().normalize();

        // 3. Verify second document exists and first is deleted
        assertTrue(secondResolvedPath.toFile().exists(), "Second document file should exist");
        assertFalse(firstResolvedPath.toFile().exists(), "First document file should have been deleted");
    }

    @Test
    void testPathTraversalAttemptRejection() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        
        // Test traversal string directly
        StoreRequest request = createBasicRequest()
                .verificationDocument("../../etc/passwd")
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("phát hiện ký tự traversal")));
    }

    @Test
    void testMalformedDataUriRejection() throws Exception {
        String token = jwtService.generateToken(ownerUser);
        
        // Missing comma
        StoreRequest request1 = createBasicRequest()
                .verificationDocument("data:image/png;base64iVBORw0KGgoAAAANS")
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isBadRequest());

        // Invalid header format
        StoreRequest request2 = createBasicRequest()
                .verificationDocument("data:image/png;invalid,abc")
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Định dạng Data URI không hợp lệ")));
    }
}
