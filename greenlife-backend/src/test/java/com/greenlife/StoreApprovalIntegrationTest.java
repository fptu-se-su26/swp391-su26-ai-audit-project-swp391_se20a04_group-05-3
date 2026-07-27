package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.store.dto.ApproveStoreRequest;
import com.greenlife.store.dto.RejectStoreRequest;
import com.greenlife.store.dto.StoreRequest;
import com.greenlife.user.entity.Role;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.User;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.store.repository.StoreApprovalAuditRepository;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.security.JwtService;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class StoreApprovalIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

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

    private final String customerEmail = "customer_store@gmail.com";
    private final String ownerEmail = "owner_store@gmail.com";
    private final String adminEmail = "admin_store@gmail.com";

    private Role customerRole;
    private Role ownerRole;
    private Role adminRole;

    private User customerUser;
    private User ownerUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        // Ensure audit table exists in case schema script hasn't run yet
        jdbcTemplate.execute(
                "IF OBJECT_ID('store_approval_audits', 'U') IS NULL " +
                "BEGIN " +
                "    CREATE TABLE store_approval_audits ( " +
                "        id INT IDENTITY(1,1) PRIMARY KEY, " +
                "        store_id INT NOT NULL, " +
                "        admin_id INT NOT NULL, " +
                "        old_status VARCHAR(30) NOT NULL, " +
                "        new_status VARCHAR(30) NOT NULL, " +
                "        reason NVARCHAR(MAX) NULL, " +
                "        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), " +
                "        CONSTRAINT fk_audits_store FOREIGN KEY (store_id) REFERENCES stores(id), " +
                "        CONSTRAINT fk_audits_admin FOREIGN KEY (admin_id) REFERENCES users(id) " +
                "    ); " +
                "END"
        );

        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        ownerRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("STORE_OWNER")
                        .description("Store Owner Role")
                        .build()));

        adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("ADMIN")
                        .description("Admin Role")
                        .build()));

        cleanupDatabase();

        customerUser = createUser(customerEmail, customerRole);
        ownerUser = createUser(ownerEmail, ownerRole);
        adminUser = createUser(adminEmail, adminRole);
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        userRepository.findByEmail(ownerEmail).ifPresent(owner -> {
            var stores = storeRepository.findByOwnerEmail(ownerEmail);
            for (Store store : stores) {
                var audits = storeApprovalAuditRepository.findByStoreId(store.getId());
                storeApprovalAuditRepository.deleteAll(audits);
                storeRepository.delete(store);
            }
        });

        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(ownerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Store Workflow User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    private Store createPendingStore(User owner) {
        return storeRepository.save(Store.builder()
                .owner(owner)
                .name("Green Life Store")
                .phone("0987654321")
                .city("Hanoi")
                .district("Cau Giay")
                .address("123 Cau Giay St")
                .description("Eco-friendly products")
                .logoUrl("http://example.com/logo.png")
                .verificationDocument("http://example.com/doc.pdf")
                .status(StoreStatus.PENDING)
                .build());
    }

    @Test
    void testCreateStoreInitialStatusIsPending() throws Exception {
        String token = jwtService.generateToken(ownerUser);

        StoreRequest request = StoreRequest.builder()
                .name("New Test Store")
                .phone("0123456789")
                .city("HCM")
                .district("District 1")
                .address("456 Le Loi")
                .description("My new garden store")
                .logoUrl("http://logo.com")
                .verificationDocument("http://doc.com")
                .build();

        mockMvc.perform(post("/api/stores/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.name", is("New Test Store")));
    }

    @Test
    void testApproveStoreSuccess() throws Exception {
        Store store = createPendingStore(ownerUser);
        String adminToken = jwtService.generateToken(adminUser);

        ApproveStoreRequest request = ApproveStoreRequest.builder()
                .reason("Documents look complete and verified")
                .build();

        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        Store updated = storeRepository.findById(store.getId()).orElseThrow();
        assertEquals(StoreStatus.APPROVED, updated.getStatus());

        // Verify audit trail record was created
        var audits = storeApprovalAuditRepository.findByStoreId(store.getId());
        assertEquals(1, audits.size());
        assertEquals(StoreStatus.PENDING, audits.get(0).getOldStatus());
        assertEquals(StoreStatus.APPROVED, audits.get(0).getNewStatus());
        assertEquals("Documents look complete and verified", audits.get(0).getReason());
        assertEquals(adminUser.getId(), audits.get(0).getAdmin().getId());
    }

    @Test
    void testRejectStoreSuccess() throws Exception {
        Store store = createPendingStore(ownerUser);
        String adminToken = jwtService.generateToken(adminUser);

        RejectStoreRequest request = RejectStoreRequest.builder()
                .reason("Invalid phone number format and missing registration documents")
                .build();

        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")));

        Store updated = storeRepository.findById(store.getId()).orElseThrow();
        assertEquals(StoreStatus.REJECTED, updated.getStatus());

        // Verify audit trail record was created
        var audits = storeApprovalAuditRepository.findByStoreId(store.getId());
        assertEquals(1, audits.size());
        assertEquals(StoreStatus.PENDING, audits.get(0).getOldStatus());
        assertEquals(StoreStatus.REJECTED, audits.get(0).getNewStatus());
        assertEquals("Invalid phone number format and missing registration documents", audits.get(0).getReason());
    }

    @Test
    void testRejectStoreMissingReasonFails() throws Exception {
        Store store = createPendingStore(ownerUser);
        String adminToken = jwtService.generateToken(adminUser);

        RejectStoreRequest request = RejectStoreRequest.builder()
                .reason("")
                .build();

        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Lý do từ chối không được để trống")));
    }

    @Test
    void testRejectStoreReasonTooLongFails() throws Exception {
        Store store = createPendingStore(ownerUser);
        String adminToken = jwtService.generateToken(adminUser);

        RejectStoreRequest request = RejectStoreRequest.builder()
                .reason("a".repeat(1001))
                .build();

        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Lý do từ chối không được vượt quá 1000 ký tự")));
    }

    @Test
    void testInvalidTransitionsThrowBadRequest() throws Exception {
        Store store = createPendingStore(ownerUser);
        String adminToken = jwtService.generateToken(adminUser);

        // Approve once
        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Try to approve again -> should fail
        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Chỉ có thể phê duyệt cửa hàng đang chờ duyệt")));

        // Try to reject approved store -> should fail
        RejectStoreRequest rejectRequest = RejectStoreRequest.builder().reason("Rejecting anyway").build();
        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Chỉ có thể từ chối cửa hàng đang chờ duyệt")));
    }

    @Test
    void testResubmitOnUpdateProfile() throws Exception {
        Store store = createPendingStore(ownerUser);
        String adminToken = jwtService.generateToken(adminUser);

        // Reject it first
        RejectStoreRequest rejectRequest = RejectStoreRequest.builder().reason("Rejected").build();
        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectRequest)))
                .andExpect(status().isOk());

        Store rejected = storeRepository.findById(store.getId()).orElseThrow();
        assertEquals(StoreStatus.REJECTED, rejected.getStatus());

        // Owner updates profile -> status must reset to PENDING
        String ownerToken = jwtService.generateToken(ownerUser);
        StoreRequest updateRequest = StoreRequest.builder()
                .name("Updated Green Life Store")
                .phone("0987654321")
                .city("Hanoi")
                .district("Cau Giay")
                .address("123 Cau Giay St")
                .description("New Description")
                .logoUrl("http://example.com/logo2.png")
                .verificationDocument("http://example.com/doc2.pdf")
                .build();

        mockMvc.perform(put("/api/store/profile")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.name", is("Updated Green Life Store")));

        Store resubmitted = storeRepository.findById(store.getId()).orElseThrow();
        assertEquals(StoreStatus.PENDING, resubmitted.getStatus());
    }

    @Test
    void testGetAuditTrailHistory() throws Exception {
        Store store = createPendingStore(ownerUser);
        String adminToken = jwtService.generateToken(adminUser);

        // Approve
        ApproveStoreRequest request = ApproveStoreRequest.builder()
                .reason("Looks solid")
                .build();

        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Get audit trail
        mockMvc.perform(get("/api/admin/stores/" + store.getId() + "/audit-trail")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].storeName", is(store.getName())))
                .andExpect(jsonPath("$[0].adminName", is(adminUser.getFullName())))
                .andExpect(jsonPath("$[0].oldStatus", is("PENDING")))
                .andExpect(jsonPath("$[0].newStatus", is("APPROVED")))
                .andExpect(jsonPath("$[0].reason", is("Looks solid")));
    }

    @Test
    void testSecurityAccessForbiddenForNonAdmins() throws Exception {
        Store store = createPendingStore(ownerUser);
        String customerToken = jwtService.generateToken(customerUser);
        String ownerToken = jwtService.generateToken(ownerUser);

        // Customer cannot approve/reject/get pending
        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/approve")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/stores/pending")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Owner cannot approve/reject/get pending
        mockMvc.perform(put("/api/admin/stores/" + store.getId() + "/approve")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/stores/pending")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
    }
}
