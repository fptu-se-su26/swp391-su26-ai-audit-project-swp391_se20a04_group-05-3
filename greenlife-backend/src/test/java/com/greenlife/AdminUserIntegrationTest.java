package com.greenlife;

import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminUserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    private User admin;
    private User customer;
    private String tokenAdmin;
    private String tokenCustomer;

    private static final String ADMIN_EMAIL = "admin_user_test@gmail.com";
    private static final String CUSTOMER_EMAIL = "customer_user_test@gmail.com";

    @BeforeEach
    void setUp() {
        cleanup();

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ADMIN").description("Admin").build()));
        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("CUSTOMER").description("Customer").build()));

        admin = userRepository.save(User.builder()
                .fullName("Admin Directory Owner")
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(adminRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        customer = userRepository.save(User.builder()
                .fullName("Customer Directory Item")
                .email(CUSTOMER_EMAIL)
                .phone("0987654321")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        tokenAdmin = jwtService.generateToken(admin);
        tokenCustomer = jwtService.generateToken(customer);
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        userRepository.findByEmail(ADMIN_EMAIL).ifPresent(userRepository::delete);
        userRepository.findByEmail(CUSTOMER_EMAIL).ifPresent(userRepository::delete);
    }

    @Test
    void testUserSearchAndFilter() throws Exception {
        // 1. Search by keyword
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("keyword", "Customer Directory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].email", is(CUSTOMER_EMAIL)));

        // 2. Filter by role
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("role", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));

        // 3. Filter by status
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void testUserDetailsLookup() throws Exception {
        mockMvc.perform(get("/api/admin/users/" + customer.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(customer.getId())))
                .andExpect(jsonPath("$.fullName", is("Customer Directory Item")))
                .andExpect(jsonPath("$.phone", is("0987654321")));
    }

    @Test
    void testLockAndUnlockUser() throws Exception {
        // Lock user
        mockMvc.perform(patch("/api/admin/users/" + customer.getId() + "/lock")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("LOCKED")));

        // Unlock user
        mockMvc.perform(patch("/api/admin/users/" + customer.getId() + "/unlock")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.failedLoginAttempts", is(0)));
    }

    @Test
    void testUpdateStatus() throws Exception {
        mockMvc.perform(patch("/api/admin/users/" + customer.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("status", "DISABLED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DISABLED")));
    }

    @Test
    void testSelfProtectionLockAttempt() throws Exception {
        mockMvc.perform(patch("/api/admin/users/" + admin.getId() + "/lock")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Không thể tự thay đổi trạng thái tài khoản của chính mình")));
    }

    @Test
    void testSelfProtectionStatusAttempt() throws Exception {
        mockMvc.perform(patch("/api/admin/users/" + admin.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("status", "DISABLED"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Không thể tự thay đổi trạng thái tài khoản của chính mình")));
    }

    @Test
    void testAccessDeniedForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + tokenCustomer))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("Access Denied")));
    }
}
