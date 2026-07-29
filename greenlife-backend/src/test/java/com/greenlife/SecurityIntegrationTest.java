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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Value("${greenlife.jwt.secret}")
    private String secretKeyProperty;

    private final String customerEmail = "customer_security@gmail.com";
    private final String ownerEmail = "owner_security@gmail.com";
    private final String adminEmail = "admin_security@gmail.com";

    private Role customerRole;
    private Role ownerRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
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

        cleanupUsers();
    }

    @AfterEach
    void tearDown() {
        cleanupUsers();
    }

    private void cleanupUsers() {
        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(ownerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Security Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    private String createExpiredToken(User user) {
        byte[] keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secretKeyProperty);
        java.security.Key key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(keyBytes);
        return io.jsonwebtoken.Jwts.builder()
                .subject(user.getUsername())
                .issuer("greenlife")
                .issuedAt(new java.util.Date(System.currentTimeMillis() - 100000))
                .expiration(new java.util.Date(System.currentTimeMillis() - 50000))
                .signWith(key)
                .compact();
    }

    private String createInvalidIssuerToken(User user) {
        byte[] keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secretKeyProperty);
        java.security.Key key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(keyBytes);
        return io.jsonwebtoken.Jwts.builder()
                .subject(user.getUsername())
                .issuer("evil-app")
                .issuedAt(new java.util.Date(System.currentTimeMillis()))
                .expiration(new java.util.Date(System.currentTimeMillis() + 900000))
                .signWith(key)
                .compact();
    }

    @Test
    void testAccessProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/store/profile")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Unauthorized")))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testAccessProtectedEndpointWithInvalidToken() throws Exception {
        mockMvc.perform(get("/api/store/profile")
                        .header("Authorization", "Bearer malformed.invalid.token")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Unauthorized")))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testAccessProtectedEndpointWithExpiredToken() throws Exception {
        User user = createUser(ownerEmail, ownerRole);
        String token = createExpiredToken(user);

        mockMvc.perform(get("/api/store/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Unauthorized")))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testAccessProtectedEndpointWithInvalidIssuer() throws Exception {
        User user = createUser(ownerEmail, ownerRole);
        String token = createInvalidIssuerToken(user);

        mockMvc.perform(get("/api/store/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Unauthorized")))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testAccessAdminEndpointAsCustomer() throws Exception {
        User user = createUser(customerEmail, customerRole);
        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/admin/stores/pending")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsString("Access Denied")))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testAccessOwnerEndpointAsCustomer() throws Exception {
        User user = createUser(customerEmail, customerRole);
        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/stores/my")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", containsString("Access Denied")))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testAccessOwnerEndpointAsStoreOwner() throws Exception {
        User user = createUser(ownerEmail, ownerRole);
        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/stores/my")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testAccessAdminEndpointAsAdmin() throws Exception {
        User user = createUser(adminEmail, adminRole);
        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/admin/stores/pending")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testStoreOwnerShoppingAccessToCustomerEndpoints() throws Exception {
        User user = createUser(ownerEmail, ownerRole);
        String token = jwtService.generateToken(user);

        // 1. GET /api/cart
        mockMvc.perform(get("/api/cart").header("Authorization", "Bearer " + token))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on GET /api/cart"));

        // 2. POST /api/cart/items
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on POST /api/cart/items"));

        // 3. GET /api/wishlist
        mockMvc.perform(get("/api/wishlist").header("Authorization", "Bearer " + token))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on GET /api/wishlist"));

        // 4. POST /api/wishlist/{plantId}
        mockMvc.perform(post("/api/wishlist/999").header("Authorization", "Bearer " + token))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on POST /api/wishlist/{plantId}"));

        // 5. POST /api/checkout
        mockMvc.perform(post("/api/checkout").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on POST /api/checkout"));

        // 6. GET /api/orders
        mockMvc.perform(get("/api/orders").header("Authorization", "Bearer " + token))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on GET /api/orders"));

        // 7. GET /api/addresses
        mockMvc.perform(get("/api/addresses").header("Authorization", "Bearer " + token))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on GET /api/addresses"));

        // 8. POST /api/payment/vnpay/url
        mockMvc.perform(post("/api/payment/vnpay/url").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on POST /api/payment/vnpay/url"));

        // 9. POST /api/bookings
        mockMvc.perform(post("/api/bookings").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on POST /api/bookings"));

        // 10. POST /api/reviews
        mockMvc.perform(post("/api/reviews").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus(), "STORE_OWNER must not receive 403 on POST /api/reviews"));
    }

    @Test
    void testCustomerShoppingAccessUnchanged() throws Exception {
        User user = createUser(customerEmail, customerRole);
        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/cart").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/wishlist").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/orders").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/addresses").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
