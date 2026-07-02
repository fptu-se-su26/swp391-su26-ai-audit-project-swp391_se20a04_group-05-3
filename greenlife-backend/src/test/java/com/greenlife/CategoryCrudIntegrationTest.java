package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.CategoryRequest;
import com.greenlife.entity.Category;
import com.greenlife.entity.Role;
import com.greenlife.entity.Store;
import com.greenlife.entity.Plant;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.PlantStatus;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.CategoryRepository;
import com.greenlife.repository.PlantRepository;
import com.greenlife.repository.RoleRepository;
import com.greenlife.repository.StoreRepository;
import com.greenlife.repository.UserRepository;
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
public class CategoryCrudIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail = "customer_cat_test@gmail.com";
    private final String adminEmail = "admin_cat_test@gmail.com";

    private Role customerRole;
    private Role adminRole;

    private User customerUser;
    private User adminUser;

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

        customerUser = createUser(customerEmail, customerRole);
        adminUser = createUser(adminEmail, adminRole);
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        // 1. Delete all plants referencing our test categories
        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Indoor Plants") || 
                c.getName().equalsIgnoreCase("Outdoor Plants") || 
                c.getName().equalsIgnoreCase("New Indoor Plants")) {
                
                for (Plant p : plantRepository.findAll()) {
                    if (p.getCategory() != null && p.getCategory().getId().equals(c.getId())) {
                        plantRepository.delete(p);
                    }
                }
            }
        }

        // 2. Also delete plants by name just in case
        for (String name : new String[]{"Mini Jade Plant", "Jade Plant", "Jade Plant 1", "Jade Plant 2", "Updated Jade Plant", "Jade Succulent", "Maple Bonsai", "Ficus Tree"}) {
            for (Plant p : plantRepository.findAll()) {
                if (p.getName().equalsIgnoreCase(name)) {
                    plantRepository.delete(p);
                }
            }
        }

        // 3. Delete test stores and their plants
        for (Store s : storeRepository.findAll()) {
            if (s.getName().equalsIgnoreCase("Green Life Store") || s.getName().equalsIgnoreCase("Test Store")) {
                plantRepository.deleteAll(plantRepository.findAll().stream()
                        .filter(p -> p.getStore().getId().equals(s.getId()))
                        .collect(java.util.stream.Collectors.toList()));
                storeRepository.delete(s);
            }
        }

        // 4. Delete test categories
        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Indoor Plants") || 
                c.getName().equalsIgnoreCase("Outdoor Plants") || 
                c.getName().equalsIgnoreCase("New Indoor Plants")) {
                categoryRepository.delete(c);
            }
        }

        // 5. Delete test users
        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail("storeowner_cat_test@gmail.com").ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Category Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testCreateCategorySuccess() throws Exception {
        String adminToken = jwtService.generateToken(adminUser);

        CategoryRequest request = CategoryRequest.builder()
                .name("Indoor Plants")
                .slug("indoor-plants")
                .description("Plants that thrive indoors")
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name", is("Indoor Plants")))
                .andExpect(jsonPath("$.slug", is("indoor-plants")))
                .andExpect(jsonPath("$.description", is("Plants that thrive indoors")));

        assertTrue(categoryRepository.existsByNameIgnoreCase("indoor plants"));
    }

    @Test
    void testCreateCategoryValidationFails() throws Exception {
        String adminToken = jwtService.generateToken(adminUser);

        CategoryRequest request = CategoryRequest.builder()
                .name("")
                .slug("")
                .description("Oops")
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("không được để trống")));
    }

    @Test
    void testCreateDuplicateCategoryNameFails() throws Exception {
        categoryRepository.save(Category.builder()
                .name("Indoor Plants")
                .slug("indoor-plants")
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        CategoryRequest request = CategoryRequest.builder()
                .name("indoor plants")
                .slug("indoor-plants-2")
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Tên danh mục đã tồn tại")));
    }

    @Test
    void testCreateDuplicateCategorySlugFails() throws Exception {
        categoryRepository.save(Category.builder()
                .name("Indoor Plants")
                .slug("indoor-plants")
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        CategoryRequest request = CategoryRequest.builder()
                .name("New Indoor Plants")
                .slug("indoor-plants")
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Slug danh mục đã tồn tại")));
    }

    @Test
    void testUpdateCategorySuccess() throws Exception {
        Category cat = categoryRepository.save(Category.builder()
                .name("Indoor Plants")
                .slug("indoor-plants")
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        CategoryRequest request = CategoryRequest.builder()
                .name("Outdoor Plants")
                .slug("outdoor-plants")
                .description("Plants that thrive outdoors")
                .build();

        mockMvc.perform(put("/api/admin/categories/" + cat.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Outdoor Plants")))
                .andExpect(jsonPath("$.slug", is("outdoor-plants")))
                .andExpect(jsonPath("$.description", is("Plants that thrive outdoors")));
    }

    @Test
    void testDeleteCategoryEnforcesUsageConstraint() throws Exception {
        Category cat = categoryRepository.save(Category.builder()
                .name("Indoor Plants")
                .slug("indoor-plants")
                .createdAt(LocalDateTime.now())
                .build());

        Role storeRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("STORE_OWNER")
                        .description("Store Owner Role")
                        .build()));

        User storeOwner = userRepository.save(User.builder()
                .fullName("Store Owner")
                .email("storeowner_cat_test@gmail.com")
                .passwordHash("hash")
                .role(storeRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        Store store = storeRepository.save(Store.builder()
                .owner(storeOwner)
                .name("Test Store")
                .address("123 Street")
                .build());

        plantRepository.save(Plant.builder()
                .store(store)
                .category(cat)
                .name("Ficus Tree")
                .slug("ficus-tree")
                .price(BigDecimal.TEN)
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        String adminToken = jwtService.generateToken(adminUser);

        mockMvc.perform(delete("/api/admin/categories/" + cat.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Category is currently in use and cannot be deleted")));

        assertTrue(categoryRepository.existsById(cat.getId()));

        // Clean up the created store and owner
        cleanupDatabase();
        userRepository.delete(storeOwner);
    }

    @Test
    void testPublicListingAllowsAnonymous() throws Exception {
        categoryRepository.save(Category.builder()
                .name("Indoor Plants")
                .slug("indoor-plants")
                .createdAt(LocalDateTime.now())
                .build());

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].name", hasItem("Indoor Plants")));
    }

    @Test
    void testAdminOnlyRestrictionsForNonAdmins() throws Exception {
        String customerToken = jwtService.generateToken(customerUser);

        CategoryRequest request = CategoryRequest.builder()
                .name("Indoor Plants")
                .slug("indoor-plants")
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
