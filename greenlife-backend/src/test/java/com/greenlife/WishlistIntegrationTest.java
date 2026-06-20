package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.WishlistCheckResponse;
import com.greenlife.dto.WishlistResponse;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.PlantStatus;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.*;
import com.greenlife.security.JwtService;
import com.greenlife.service.WishlistService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class WishlistIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail = "wish_customer@gmail.com";
    private final String storeOwnerEmail = "wish_storeowner@gmail.com";
    private final String adminEmail = "wish_admin@gmail.com";

    private Role customerRole;
    private Role storeOwnerRole;
    private Role adminRole;

    private User customer;
    private User storeOwner;
    private User adminUser;

    private Store store;
    private Category category;
    private Plant plantActive;
    private Plant plantOutOfStock;
    private Plant plantInactive;

    @BeforeEach
    void setUp() {
        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        storeOwnerRole = roleRepository.findByName("STORE_OWNER")
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

        customer = createUser(customerEmail, customerRole);
        storeOwner = createUser(storeOwnerEmail, storeOwnerRole);
        adminUser = createUser(adminEmail, adminRole);

        store = storeRepository.save(Store.builder()
                .owner(storeOwner)
                .name("Wishlist Store")
                .address("Wishlist Address")
                .status(com.greenlife.entity.enums.StoreStatus.APPROVED)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Wishlist Category")
                .slug("wish-cat")
                .createdAt(LocalDateTime.now())
                .build());

        plantActive = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Wish Plant Active")
                .slug("wish-plant-active")
                .price(new BigDecimal("50000"))
                .stock(10)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        plantOutOfStock = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Wish Plant Out of Stock")
                .slug("wish-plant-oos")
                .price(new BigDecimal("75000"))
                .stock(0)
                .status(PlantStatus.OUT_OF_STOCK)
                .createdAt(LocalDateTime.now())
                .build());

        plantInactive = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Wish Plant Inactive")
                .slug("wish-plant-inactive")
                .price(new BigDecimal("100000"))
                .stock(5)
                .status(PlantStatus.INACTIVE)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        wishlistRepository.deleteAll();

        for (Store s : storeRepository.findAll()) {
            if (s.getName().startsWith("Wishlist Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        categoryRepository.findByNameIgnoreCase("Wishlist Category").ifPresent(categoryRepository::delete);

        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Wishlist Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testAddActivePlant() throws Exception {
        String token = jwtService.generateToken(customer);

        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.plantId", is(plantActive.getId())))
                .andExpect(jsonPath("$.plantName", is("Wish Plant Active")))
                .andExpect(jsonPath("$.plantPrice", is(50000)))
                .andExpect(jsonPath("$.plantStatus", is("ACTIVE")));
    }

    @Test
    void testAddOutOfStockPlant() throws Exception {
        String token = jwtService.generateToken(customer);

        mockMvc.perform(post("/api/wishlist/" + plantOutOfStock.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.plantId", is(plantOutOfStock.getId())))
                .andExpect(jsonPath("$.plantStatus", is("OUT_OF_STOCK")));
    }

    @Test
    void testRejectInactivePlant() throws Exception {
        String token = jwtService.generateToken(customer);

        mockMvc.perform(post("/api/wishlist/" + plantInactive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Sản phẩm đã ngừng kinh doanh và không thể thêm vào danh sách yêu thích")));
    }

    @Test
    void testDuplicateAddProtection() throws Exception {
        String token = jwtService.generateToken(customer);

        // First add
        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Second add (should return 400 Bad Request as per business logic message)
        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Sản phẩm đã có trong danh sách yêu thích của bạn")));
    }

    @Test
    void testRemoveWishlistItem() throws Exception {
        String token = jwtService.generateToken(customer);

        // Add item
        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Remove item
        mockMvc.perform(delete("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Verify it is gone
        mockMvc.perform(get("/api/wishlist/check/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorited", is(false)));

        // Remove non-existent item -> should return 404
        mockMvc.perform(delete("/api/wishlist/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void testFavoriteStatusCheck() throws Exception {
        String token = jwtService.generateToken(customer);

        // Initially not favorited
        mockMvc.perform(get("/api/wishlist/check/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorited", is(false)));

        // Add
        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Now favorited
        mockMvc.perform(get("/api/wishlist/check/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorited", is(true)));
    }

    @Test
    void testPaginationAndSorting() throws Exception {
        String token = jwtService.generateToken(customer);

        // Add plantActive
        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Wait a tiny bit to ensure distinct addedAt timestamps
        Thread.sleep(100);

        // Add plantOutOfStock
        mockMvc.perform(post("/api/wishlist/" + plantOutOfStock.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Fetch paginated wishlist
        mockMvc.perform(get("/api/wishlist?page=0&size=5")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].plantId", is(plantOutOfStock.getId()))) // Sorted by addedAt desc
                .andExpect(jsonPath("$.content[1].plantId", is(plantActive.getId())));
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/wishlist"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/wishlist/" + plantActive.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAdminForbidden() throws Exception {
        String token = jwtService.generateToken(adminUser);

        mockMvc.perform(get("/api/wishlist")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStoreOwnerForbidden() throws Exception {
        String token = jwtService.generateToken(storeOwner);

        mockMvc.perform(get("/api/wishlist")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/wishlist/" + plantActive.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void testConcurrencyDuplicateProtection() throws Exception {
        int threadCount = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<WishlistResponse>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                try {
                    latch.await();
                    return wishlistService.addToWishlist(customer.getId(), plantActive.getId());
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }));
        }

        latch.countDown();
        executor.shutdown();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));

        // Verify that all threads returned a valid response safely
        for (Future<WishlistResponse> future : futures) {
            assertNotNull(future.get());
        }

        // Verify exactly one item is present in database
        long count = wishlistRepository.count();
        assertEquals(1, count);
    }
}
