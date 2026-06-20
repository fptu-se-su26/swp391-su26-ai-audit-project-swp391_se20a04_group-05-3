package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.PlantRequest;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.PlantStatus;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.*;
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
import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ProductCrudIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail = "customer_prod_test@gmail.com";
    private final String adminEmail = "admin_prod_test@gmail.com";
    private final String storeOwnerEmail = "storeowner_prod_test@gmail.com";

    private Role customerRole;
    private Role adminRole;
    private Role storeRole;

    private User customerUser;
    private User adminUser;
    private User storeOwnerUser;

    private Store store;
    private Category category1;
    private Category category2;

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

        storeRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("STORE_OWNER")
                        .description("Store Owner Role")
                        .build()));

        cleanupDatabase();

        customerUser = createUser(customerEmail, customerRole);
        adminUser = createUser(adminEmail, adminRole);
        storeOwnerUser = createUser(storeOwnerEmail, storeRole);

        store = storeRepository.save(Store.builder()
                .owner(storeOwnerUser)
                .name("Green Life Store")
                .address("123 Street")
                .build());

        category1 = categoryRepository.save(Category.builder()
                .name("Succulents")
                .slug("succulents")
                .createdAt(LocalDateTime.now())
                .build());

        category2 = categoryRepository.save(Category.builder()
                .name("Bonsai")
                .slug("bonsai")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        // 1. Delete all plants referencing our test categories first
        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Indoor Plants") || 
                c.getName().equalsIgnoreCase("Outdoor Plants") || 
                c.getName().equalsIgnoreCase("New Indoor Plants") ||
                c.getName().equalsIgnoreCase("Succulents") ||
                c.getName().equalsIgnoreCase("Bonsai")) {
                
                for (Plant p : plantRepository.findAll()) {
                    if (p.getCategory() != null && p.getCategory().getId().equals(c.getId())) {
                        plantRepository.delete(p);
                    }
                }
            }
        }

        // 2. Also delete plants by name
        for (String name : new String[]{"Mini Jade Plant", "Jade Plant", "Jade Plant 1", "Jade Plant 2", "Updated Jade Plant", "Jade Succulent", "Maple Bonsai", "Ficus Tree"}) {
            for (Plant p : plantRepository.findAll()) {
                if (p.getName().equalsIgnoreCase(name)) {
                    plantRepository.delete(p);
                }
            }
        }

        // 3. Delete test stores and any plants belonging to them
        for (Store s : storeRepository.findAll()) {
            if (s.getName().equalsIgnoreCase("Green Life Store") || s.getName().equalsIgnoreCase("Test Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        // 4. Delete test categories
        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Indoor Plants") || 
                c.getName().equalsIgnoreCase("Outdoor Plants") || 
                c.getName().equalsIgnoreCase("New Indoor Plants") ||
                c.getName().equalsIgnoreCase("Succulents") ||
                c.getName().equalsIgnoreCase("Bonsai")) {
                categoryRepository.delete(c);
            }
        }

        // 5. Delete test users
        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail("storeowner_cat_test@gmail.com").ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Product Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testCreateProductSuccess() throws Exception {
        String adminToken = jwtService.generateToken(adminUser);

        PlantRequest request = PlantRequest.builder()
                .name("Mini Jade Plant")
                .slug("mini-jade-plant")
                .storeId(store.getId())
                .categoryId(category1.getId())
                .description("A beautiful jade succulent")
                .price(new BigDecimal("150000"))
                .stock(20)
                .imageUrl("http://image.com/jade.jpg")
                .careLevel("Easy")
                .sunlight("Full sun")
                .waterLevel("Low")
                .status("ACTIVE")
                .build();

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name", is("Mini Jade Plant")))
                .andExpect(jsonPath("$.slug", is("mini-jade-plant")))
                .andExpect(jsonPath("$.price", is(150000)))
                .andExpect(jsonPath("$.stock", is(20)))
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    void testCreateProductValidationFails() throws Exception {
        String adminToken = jwtService.generateToken(adminUser);

        // Negative price and stock
        PlantRequest request = PlantRequest.builder()
                .name("Mini Jade Plant")
                .slug("mini-jade-plant")
                .storeId(store.getId())
                .categoryId(category1.getId())
                .price(new BigDecimal("-10"))
                .stock(-5)
                .build();

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("phải lớn hơn hoặc bằng 0")));
    }

    @Test
    void testCreateDuplicateProductNamePerStoreFails() throws Exception {
        plantRepository.save(Plant.builder()
                .store(store)
                .category(category1)
                .name("Jade Plant")
                .slug("jade-plant-1")
                .price(BigDecimal.TEN)
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        PlantRequest request = PlantRequest.builder()
                .name("jade plant")
                .slug("jade-plant-2")
                .storeId(store.getId())
                .categoryId(category1.getId())
                .price(BigDecimal.TEN)
                .stock(5)
                .build();

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Tên sản phẩm đã tồn tại trong cửa hàng này")));
    }

    @Test
    void testCreateDuplicateProductSlugPerStoreFails() throws Exception {
        plantRepository.save(Plant.builder()
                .store(store)
                .category(category1)
                .name("Jade Plant 1")
                .slug("jade-plant")
                .price(BigDecimal.TEN)
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        PlantRequest request = PlantRequest.builder()
                .name("Jade Plant 2")
                .slug("jade-plant")
                .storeId(store.getId())
                .categoryId(category1.getId())
                .price(BigDecimal.TEN)
                .stock(5)
                .build();

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Slug sản phẩm đã tồn tại trong cửa hàng này")));
    }

    @Test
    void testUpdateProductSuccess() throws Exception {
        Plant p = plantRepository.save(Plant.builder()
                .store(store)
                .category(category1)
                .name("Jade Plant")
                .slug("jade-plant")
                .price(BigDecimal.TEN)
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        PlantRequest request = PlantRequest.builder()
                .name("Updated Jade Plant")
                .slug("updated-jade-plant")
                .storeId(store.getId())
                .categoryId(category2.getId())
                .price(new BigDecimal("200000"))
                .stock(15)
                .build();

        mockMvc.perform(put("/api/admin/products/" + p.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Jade Plant")))
                .andExpect(jsonPath("$.slug", is("updated-jade-plant")))
                .andExpect(jsonPath("$.price", is(200000)))
                .andExpect(jsonPath("$.stock", is(15)))
                .andExpect(jsonPath("$.categoryName", is("Bonsai")));
    }

    @Test
    void testSoftDeleteAndProductVisibility() throws Exception {
        Plant p = plantRepository.save(Plant.builder()
                .store(store)
                .category(category1)
                .name("Jade Plant")
                .slug("jade-plant")
                .price(BigDecimal.TEN)
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        // Verify public lookup works initially
        mockMvc.perform(get("/api/products/" + p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")));

        // Perform Soft Delete
        mockMvc.perform(delete("/api/admin/products/" + p.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify database status is updated to INACTIVE
        Plant deleted = plantRepository.findById(p.getId()).orElseThrow();
        assertEquals(PlantStatus.INACTIVE, deleted.getStatus());

        // Verify public lookup returns 404 now
        mockMvc.perform(get("/api/products/" + p.getId()))
                .andExpect(status().isNotFound());

        // Verify public search list does not return the inactive product
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].name", not(hasItem("Jade Plant"))));
    }

    @Test
    void testSearchPaginationAndCategoryFiltering() throws Exception {
        plantRepository.save(Plant.builder()
                .store(store)
                .category(category1)
                .name("Jade Succulent")
                .slug("jade-succulent")
                .price(BigDecimal.TEN)
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        plantRepository.save(Plant.builder()
                .store(store)
                .category(category2)
                .name("Maple Bonsai")
                .slug("maple-bonsai")
                .price(BigDecimal.TEN)
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        // Filter by search keyword
        mockMvc.perform(get("/api/products?search=jade"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].name", hasItem("Jade Succulent")));

        // Filter by category
        mockMvc.perform(get("/api/products?category=bonsai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].name", hasItem("Maple Bonsai")));

        // Pagination test
        mockMvc.perform(get("/api/products?page=0&size=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testAdminOnlyWriteRestrictionsForNonAdmins() throws Exception {
        String customerToken = jwtService.generateToken(customerUser);

        PlantRequest request = PlantRequest.builder()
                .name("Mini Jade Plant")
                .slug("mini-jade-plant")
                .storeId(store.getId())
                .categoryId(category1.getId())
                .price(BigDecimal.TEN)
                .stock(5)
                .build();

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
