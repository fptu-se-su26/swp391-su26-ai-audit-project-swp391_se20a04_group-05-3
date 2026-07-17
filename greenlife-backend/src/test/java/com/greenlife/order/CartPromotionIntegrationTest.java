package com.greenlife.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.category.entity.Category;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.order.entity.CartItem;
import com.greenlife.order.repository.CartItemRepository;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionProduct;
import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import com.greenlife.security.JwtService;
import com.greenlife.store.entity.Store;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CartPromotionIntegrationTest {

    static {
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl == null) {
            dbUrl = "jdbc:sqlserver://localhost:1433;databaseName=GreenLife;encrypt=false;trustServerCertificate=true";
        }
        String dbUser = System.getenv("DB_USERNAME");
        if (dbUser == null) {
            dbUser = "sa";
        }
        String dbPassword = System.getenv("DB_PASSWORD");
        if (dbPassword == null) {
            dbPassword = "sa";
        }
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            try (java.sql.Connection conn = java.sql.DriverManager.getConnection(dbUrl, dbUser, dbPassword);
                 java.sql.Statement stmt = conn.createStatement()) {
                
                stmt.execute("IF OBJECT_ID('promotions', 'U') IS NULL " +
                        "CREATE TABLE promotions (" +
                        "  id INT IDENTITY(1,1) PRIMARY KEY," +
                        "  name NVARCHAR(150) NOT NULL," +
                        "  description NVARCHAR(MAX)," +
                        "  scope_type VARCHAR(30) NOT NULL," +
                        "  discount_type VARCHAR(30) NOT NULL," +
                        "  discount_value DECIMAL(12,0) NOT NULL," +
                        "  funding_source VARCHAR(30) NOT NULL," +
                        "  platform_funding_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00," +
                        "  store_funding_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00," +
                        "  priority INT NOT NULL DEFAULT 0," +
                        "  max_discount_amount DECIMAL(12,0)," +
                        "  budget DECIMAL(12,0) NOT NULL," +
                        "  reserved_budget DECIMAL(12,0) NOT NULL DEFAULT 0," +
                        "  consumed_budget DECIMAL(12,0) NOT NULL DEFAULT 0," +
                        "  released_budget DECIMAL(12,0) NOT NULL DEFAULT 0," +
                        "  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'," +
                        "  version INT NOT NULL," +
                        "  created_by INT NOT NULL," +
                        "  activated_by INT," +
                        "  ended_by INT," +
                        "  created_at DATETIME2 NOT NULL DEFAULT GETDATE()," +
                        "  activated_at DATETIME2," +
                        "  ended_at DATETIME2," +
                        "  end_reason NVARCHAR(250)" +
                        ");");

                stmt.execute("IF OBJECT_ID('promotion_stores', 'U') IS NULL " +
                        "CREATE TABLE promotion_stores (" +
                        "  promotion_id INT NOT NULL," +
                        "  store_id INT NOT NULL," +
                        "  PRIMARY KEY (promotion_id, store_id)" +
                        ");");

                stmt.execute("IF OBJECT_ID('promotion_products', 'U') IS NULL " +
                        "CREATE TABLE promotion_products (" +
                        "  promotion_id INT NOT NULL," +
                        "  plant_id INT NOT NULL," +
                        "  PRIMARY KEY (promotion_id, plant_id)" +
                        ");");

            }
        } catch (Exception e) {
            System.err.println("Failed to pre-create promotion tables: " + e.getMessage());
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private com.greenlife.chat.service.ChatRateLimiter chatRateLimiter;

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
    private CartItemRepository cartItemRepository;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private PromotionProductRepository promotionProductRepository;

    @Autowired
    private PromotionStoreRepository promotionStoreRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail = "promo_cart_cust@gmail.com";
    private final String storeOwnerEmail = "promo_cart_owner@gmail.com";

    private User customer;
    private User storeOwner;
    private Store store;
    private Category category;
    private Plant plant;
    private String token;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        Role storeRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("STORE_OWNER")
                        .description("Store Owner Role")
                        .build()));

        cleanupDatabase();

        customer = userRepository.save(User.builder()
                .fullName("Promo Customer")
                .email(customerEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        storeOwner = userRepository.save(User.builder()
                .fullName("Promo Store Owner")
                .email(storeOwnerEmail)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(storeRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        store = storeRepository.save(Store.builder()
                .owner(storeOwner)
                .name("Promo Cart Store")
                .address("456 Street")
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Promo Succulents")
                .slug("promo-succulents")
                .createdAt(LocalDateTime.now())
                .build());

        plant = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Promo Jade Plant")
                .slug("promo-jade-plant")
                .price(new BigDecimal("100000"))
                .stock(10)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        token = jwtService.generateToken(customer);
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        cartItemRepository.deleteAll();
        promotionProductRepository.deleteAll();
        promotionStoreRepository.deleteAll();
        promotionRepository.deleteAll();

        for (Plant p : plantRepository.findAll()) {
            if (p.getName().equalsIgnoreCase("Promo Jade Plant")) {
                plantRepository.delete(p);
            }
        }
        for (Store s : storeRepository.findAll()) {
            if (s.getName().equalsIgnoreCase("Promo Cart Store")) {
                storeRepository.delete(s);
            }
        }
        categoryRepository.findByNameIgnoreCase("Promo Succulents").ifPresent(categoryRepository::delete);

        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
    }

    @Test
    void testCartReadRepricingFlow() throws Exception {
        // 1. Add item to cart (Quantity = 3)
        CartItem cartItem = cartItemRepository.save(CartItem.builder()
                .customer(customer)
                .plant(plant)
                .quantity(3)
                .addedAt(LocalDateTime.now())
                .build());

        // 2. Fetch cart with NO active promotions. Should return base prices.
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].plantName", is("Promo Jade Plant")))
                .andExpect(jsonPath("$.items[0].onSale", is(false)))
                .andExpect(jsonPath("$.items[0].baseUnitPrice", is(100000)))
                .andExpect(jsonPath("$.items[0].effectiveUnitPrice", is(100000)))
                .andExpect(jsonPath("$.items[0].lineBaseAmount", is(300000)))
                .andExpect(jsonPath("$.items[0].lineEffectiveAmount", is(300000)))
                .andExpect(jsonPath("$.items[0].lineDiscountAmount", is(0)))
                .andExpect(jsonPath("$.subtotal", is(300000)));

        // 3. Create and activate a promotion (PRODUCT scope, 25% discount)
        Promotion promo = promotionRepository.save(Promotion.builder()
                .name("Jade Plant Sale")
                .description("Jade sale description")
                .scopeType(PromotionScopeType.PRODUCT)
                .discountType(PromotionDiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("25"))
                .priority(10)
                .budget(new BigDecimal("500000"))
                .reservedBudget(BigDecimal.ZERO)
                .consumedBudget(BigDecimal.ZERO)
                .releasedBudget(BigDecimal.ZERO)
                .status(PromotionStatus.ACTIVE)
                .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
                .platformFundingRatio(new BigDecimal("100"))
                .storeFundingRatio(BigDecimal.ZERO)
                .createdBy(storeOwner)
                .createdAt(LocalDateTime.now())
                .build());

        promotionProductRepository.save(PromotionProduct.builder()
                .id(new com.greenlife.promotion.entity.PromotionProductId(promo.getId(), plant.getId()))
                .promotion(promo)
                .plant(plant)
                .build());

        // 4. Fetch cart again. Should apply the promotion immediately and dynamically.
        // Discount per item = 100,000 * 25% = 25,000. Effective = 75,000.
        // Line total: base = 300,000, effective = 225,000, discount = 75,000.
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].onSale", is(true)))
                .andExpect(jsonPath("$.items[0].promotionId", is(promo.getId())))
                .andExpect(jsonPath("$.items[0].baseUnitPrice", is(100000)))
                .andExpect(jsonPath("$.items[0].effectiveUnitPrice", is(75000)))
                .andExpect(jsonPath("$.items[0].lineBaseAmount", is(300000)))
                .andExpect(jsonPath("$.items[0].lineEffectiveAmount", is(225000)))
                .andExpect(jsonPath("$.items[0].lineDiscountAmount", is(75000)))
                .andExpect(jsonPath("$.subtotal", is(225000)));

        // Verify that database states have NOT been mutated by this GET request
        Plant plantInDb = plantRepository.findById(plant.getId()).orElseThrow();
        // Plant database price should remain unmodified
        assertFalse(plantInDb.getPrice().compareTo(new BigDecimal("100000")) != 0);

        // 5. Deactivate/End the promotion
        promo.setStatus(PromotionStatus.ENDED);
        promotionRepository.save(promo);

        // 6. Fetch cart again. Should revert to base price immediately.
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].onSale", is(false)))
                .andExpect(jsonPath("$.items[0].baseUnitPrice", is(100000)))
                .andExpect(jsonPath("$.items[0].effectiveUnitPrice", is(100000)))
                .andExpect(jsonPath("$.items[0].lineBaseAmount", is(300000)))
                .andExpect(jsonPath("$.items[0].lineEffectiveAmount", is(300000)))
                .andExpect(jsonPath("$.items[0].lineDiscountAmount", is(0)))
                .andExpect(jsonPath("$.subtotal", is(300000)));
    }
}
