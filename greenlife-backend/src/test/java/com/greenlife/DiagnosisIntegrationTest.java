package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.*;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.entity.enums.Severity;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.*;
import com.greenlife.security.JwtService;
import com.greenlife.service.FileStorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class DiagnosisIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DiagnosisHistoryRepository diagnosisHistoryRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private SecurityAuditRepository securityAuditRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmailA = "diag_customer_a@gmail.com";
    private final String customerEmailB = "diag_customer_b@gmail.com";
    private final String adminEmail = "diag_admin@gmail.com";

    private Role customerRole;
    private Role adminRole;

    private User customerA;
    private User customerB;
    private User admin;

    private Plant plant;
    private String customerAToken;
    private String customerBToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
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

        cleanupDatabase();

        customerA = createUser(customerEmailA, customerRole);
        customerB = createUser(customerEmailB, customerRole);
        admin = createUser(adminEmail, adminRole);

        customerAToken = "Bearer " + jwtService.generateToken(customerA);
        customerBToken = "Bearer " + jwtService.generateToken(customerB);
        adminToken = "Bearer " + jwtService.generateToken(admin);

        Store store = storeRepository.save(Store.builder()
                .owner(admin)
                .name("Diag Test Store")
                .address("Store address")
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Diag Category")
                .slug("diag-category")
                .createdAt(LocalDateTime.now())
                .build());

        plant = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Succulent Echeveria")
                .slug("succulent-echeveria")
                .price(new BigDecimal("25000"))
                .stock(100)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
        // Clean up uploads directory created during tests
        deleteDirectory(new File("./uploads"));
    }

    private void cleanupDatabase() {
        securityAuditRepository.deleteAll();
        diagnosisHistoryRepository.hardDeleteAll();
        plantRepository.deleteAll();
        categoryRepository.deleteAll();
        storeRepository.deleteAll();
        userRepository.findByEmail(customerEmailA).ifPresent(userRepository::delete);
        userRepository.findByEmail(customerEmailB).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Test User " + email)
                .email(email)
                .passwordHash(passwordEncoder.encode("password123"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private byte[] createValidImageBytes() throws IOException {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    private void deleteDirectory(File dir) {
        if (dir.exists()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    deleteDirectory(f);
                }
            }
            dir.delete();
        }
    }

    @Test
    void testValidUpload() throws Exception {
        byte[] imgBytes = createValidImageBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", imgBytes);

        mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .param("plantId", plant.getId().toString())
                        .header("Authorization", customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diseaseName", containsString("Bệnh héo rũ")))
                .andExpect(jsonPath("$.confidenceScore", is(94.85)))
                .andExpect(jsonPath("$.severity", is("MEDIUM")))
                .andExpect(jsonPath("$.imageUrl", startsWith("/uploads/diagnoses/")));
    }

    @Test
    void testOversizedUpload() throws Exception {
        byte[] oversizedBytes = new byte[6 * 1024 * 1024]; // 6MB
        MockMultipartFile file = new MockMultipartFile("file", "large.png", "image/png", oversizedBytes);

        mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .header("Authorization", customerAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("exceeds limit")));
    }

    @Test
    void testSpoofedExtension() throws Exception {
        byte[] txtBytes = "Not an image file".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "virus.png", "image/png", txtBytes);

        mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .header("Authorization", customerAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("content")));
    }

    @Test
    void testCorruptedImage() throws Exception {
        byte[] corruptedBytes = new byte[]{1, 2, 3, 4, 5};
        MockMultipartFile file = new MockMultipartFile("file", "corrupt.jpg", "image/jpeg", corruptedBytes);

        mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .header("Authorization", customerAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("content")));
    }

    @Test
    void testDailyLimit() throws Exception {
        byte[] imgBytes = createValidImageBytes();

        // Perform 20 diagnoses
        for (int i = 0; i < 20; i++) {
            MockMultipartFile file = new MockMultipartFile("file", "test-" + i + ".png", "image/png", imgBytes);
            mockMvc.perform(multipart("/api/diagnoses")
                            .file(file)
                            .header("Authorization", customerAToken))
                    .andExpect(status().isOk());
        }

        // The 21st must return 429
        MockMultipartFile file = new MockMultipartFile("file", "test-21.png", "image/png", imgBytes);
        mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .header("Authorization", customerAToken))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error", containsString("20 lượt/ngày")));
    }

    @Test
    void testQuotaLimit() throws Exception {
        // Manually seed 200 records in database
        for (int i = 0; i < 200; i++) {
            diagnosisHistoryRepository.save(DiagnosisHistory.builder()
                    .customer(customerA)
                    .plant(plant)
                    .imageUrl("/uploads/diagnoses/mock-" + i + ".png")
                    .diseaseName("Mock disease")
                    .confidenceScore(new BigDecimal("90.00"))
                    .severity(Severity.LOW)
                    .deleted(false)
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build());
        }

        byte[] imgBytes = createValidImageBytes();
        MockMultipartFile file = new MockMultipartFile("file", "quota.png", "image/png", imgBytes);

        mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .header("Authorization", customerAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("tối đa 200 ảnh")));
    }

    @Test
    void testPaginationAndFiltering() throws Exception {
        // Seed some history logs
        diagnosisHistoryRepository.save(DiagnosisHistory.builder()
                .customer(customerA)
                .plant(plant)
                .imageUrl("/uploads/diagnoses/1.png")
                .diseaseName("Disease A")
                .severity(Severity.LOW)
                .deleted(false)
                .build());

        diagnosisHistoryRepository.save(DiagnosisHistory.builder()
                .customer(customerA)
                .imageUrl("/uploads/diagnoses/2.png")
                .diseaseName("Disease B")
                .severity(Severity.HIGH)
                .deleted(false)
                .build());

        // Get history sorted by default
        mockMvc.perform(get("/api/diagnoses")
                        .header("Authorization", customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].diseaseName", is("Disease B"))); // CreatedAt DESC default

        // Test filtering by severity
        mockMvc.perform(get("/api/diagnoses")
                        .param("severity", "LOW")
                        .header("Authorization", customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].diseaseName", is("Disease A")));

        // Test filtering by plant
        mockMvc.perform(get("/api/diagnoses")
                        .param("plantId", plant.getId().toString())
                        .header("Authorization", customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].diseaseName", is("Disease A")));
    }

    @Test
    void testPaginationCap() throws Exception {
        mockMvc.perform(get("/api/diagnoses")
                        .param("size", "150")
                        .header("Authorization", customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pageable.pageSize", is(100)));
    }

    @Test
    void testIdorProtection() throws Exception {
        DiagnosisHistory diagA = diagnosisHistoryRepository.save(DiagnosisHistory.builder()
                .customer(customerA)
                .imageUrl("/uploads/diagnoses/a.png")
                .diseaseName("Disease A")
                .deleted(false)
                .build());

        // Customer B tries to view Customer A's diagnosis details -> 403 Forbidden
        mockMvc.perform(get("/api/diagnoses/" + diagA.getId())
                        .header("Authorization", customerBToken))
                .andExpect(status().isForbidden());

        // Customer A can view their own details -> 200 OK
        mockMvc.perform(get("/api/diagnoses/" + diagA.getId())
                        .header("Authorization", customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diseaseName", is("Disease A")));
    }

    @Test
    void testOrphanCleanupOnFailure() throws Exception {
        // Prepare invalid plantId to trigger validation failure in service layer
        byte[] imgBytes = createValidImageBytes();
        MockMultipartFile file = new MockMultipartFile("file", "orphan.png", "image/png", imgBytes);

        // This call will fail due to plantId -999 not existing
        mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .param("plantId", "-999")
                        .header("Authorization", customerAToken))
                .andExpect(status().isBadRequest());

        // Assert that no file exists in ./uploads/diagnoses
        File uploadFolder = new File("./uploads/diagnoses");
        if (uploadFolder.exists()) {
            File[] files = uploadFolder.listFiles();
            if (files != null) {
                assertEquals(0, files.length, "File should have been cleaned up");
            }
        }
    }

    @Test
    void testAdminPurgeAndAudit() throws Exception {
        byte[] imgBytes = createValidImageBytes();
        MockMultipartFile file = new MockMultipartFile("file", "purge.png", "image/png", imgBytes);

        // 1. Create a diagnosis
        MvcResult result = mockMvc.perform(multipart("/api/diagnoses")
                        .file(file)
                        .header("Authorization", customerAToken))
                .andExpect(status().isOk())
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        DiagnosisResponse response = objectMapper.readValue(responseStr, DiagnosisResponse.class);

        // Confirm file is on disk
        String relativeUrl = response.getImageUrl().substring("/uploads/diagnoses/".length());
        File diskFile = new File("./uploads/diagnoses/" + relativeUrl);
        assertTrue(diskFile.exists(), "File should be created on disk");

        // 2. Customer tries to purge -> 403
        mockMvc.perform(delete("/api/admin/diagnoses/" + response.getId())
                        .header("Authorization", customerAToken))
                .andExpect(status().isForbidden());

        // 3. Admin purges -> 204
        mockMvc.perform(delete("/api/admin/diagnoses/" + response.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        // Verify DB soft deleted
        assertFalse(diagnosisHistoryRepository.findById(response.getId()).isPresent(), "Record should be soft-deleted");
        assertTrue(diagnosisHistoryRepository.findIncludingDeleted(response.getId()).isPresent(), "Record should be present in direct native check");

        // Verify physical file deleted from disk
        assertFalse(diskFile.exists(), "File should be deleted from disk");

        // Verify Security Audit created
        List<SecurityAudit> audits = securityAuditRepository.findAll();
        assertFalse(audits.isEmpty());
        SecurityAudit audit = audits.get(0);
        assertEquals(SecurityAuditAction.ADMIN_ACTION, audit.getAction());
        assertTrue(audit.getDetails().contains("purged diagnosis"));
    }
}
