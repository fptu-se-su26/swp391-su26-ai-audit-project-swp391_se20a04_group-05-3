package com.greenlife;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.category.entity.Category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.CheckoutRequest;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CheckoutIntegrationTest {

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
    private StoreRepository storeRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail1 = "check_customer1@gmail.com";
    private final String customerEmail2 = "check_customer2@gmail.com";
    private final String storeOwnerEmail = "check_storeowner@gmail.com";

    private Role customerRole;
    private Role storeRole;

    private User customer1;
    private User customer2;
    private User storeOwner;

    private Store store;
    private Category category;
    private Plant activePlant1;
    private Plant activePlant2;

    @BeforeEach
    void setUp() {
        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        storeRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("STORE_OWNER")
                        .description("Store Owner Role")
                        .build()));

        cleanupDatabase();

        customer1 = createUser(customerEmail1, customerRole);
        customer2 = createUser(customerEmail2, customerRole);
        storeOwner = createUser(storeOwnerEmail, storeRole);

        store = storeRepository.save(Store.builder()
                .owner(storeOwner)
                .name("Checkout Test Store")
                .address("123 Street")
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Checkout Succulents")
                .slug("checkout-succulents")
                .createdAt(LocalDateTime.now())
                .build());

        activePlant1 = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Checkout Plant 1")
                .slug("checkout-plant-1")
                .price(new BigDecimal("100000"))
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        activePlant2 = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Checkout Plant 2")
                .slug("checkout-plant-2")
                .price(new BigDecimal("200000"))
                .stock(3)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Inactive Checkout Plant")
                .slug("inactive-checkout")
                .price(new BigDecimal("150000"))
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
        // 1. Delete details and orders first
        orderDetailRepository.deleteAll();
        orderRepository.deleteAll();

        // 2. Delete all cart items
        cartItemRepository.deleteAll();

        // 3. Delete plants
        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Checkout Succulents")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getCategory() != null && p.getCategory().getId().equals(c.getId())) {
                        plantRepository.delete(p);
                    }
                }
            }
        }

        for (Store s : storeRepository.findAll()) {
            if (s.getName().equalsIgnoreCase("Checkout Test Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        // 4. Delete category
        categoryRepository.findByNameIgnoreCase("Checkout Succulents").ifPresent(categoryRepository::delete);

        // 5. Delete users
        userRepository.findByEmail(customerEmail1).ifPresent(userRepository::delete);
        userRepository.findByEmail(customerEmail2).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Checkout Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testSuccessfulCheckout() throws Exception {
        String token = jwtService.generateToken(customer1);

        // Add items to cart
        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant1)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant2)
                .quantity(1)
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .note("Please deliver after 5 PM")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].subtotal", is(400000))) // (100000 * 2) + 200000
                .andExpect(jsonPath("$[0].totalAmount", is(400000)))
                .andExpect(jsonPath("$[0].recipientName", is("Alice")))
                .andExpect(jsonPath("$[0].details", hasSize(2)));

        // Verify stock is deducted
        Plant updatedPlant1 = plantRepository.findById(activePlant1.getId()).orElseThrow();
        assertEquals(3, updatedPlant1.getStock()); // 5 - 2

        Plant updatedPlant2 = plantRepository.findById(activePlant2.getId()).orElseThrow();
        assertEquals(2, updatedPlant2.getStock()); // 3 - 1

        // Verify cart is cleared
        assertTrue(cartItemRepository.findByCustomerId(customer1.getId()).isEmpty());
    }

    @Test
    void testEmptyCartCheckoutFails() throws Exception {
        String token = jwtService.generateToken(customer1);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Giỏ hàng của bạn đang trống")));
    }

    @Test
    void testInsufficientStockCheckoutFails() throws Exception {
        String token = jwtService.generateToken(customer1);

        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant1)
                .quantity(6) // activePlant1 stock is 5
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("không đủ tồn kho khả dụng")));
    }

    @Test
    void testTransactionRollbackOnStockFailure() throws Exception {
        String token = jwtService.generateToken(customer1);

        // Add one valid item and one invalid item (exceeding stock)
        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant1)
                .quantity(2) // valid: stock is 5
                .addedAt(LocalDateTime.now())
                .build());

        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant2)
                .quantity(4) // invalid: stock is 3
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isBadRequest());

        // Verify no orders or details are saved
        assertTrue(orderRepository.findAll().isEmpty());
        assertTrue(orderDetailRepository.findAll().isEmpty());

        // Verify stock is not deducted (activePlant1 stock should still be 5)
        Plant p1 = plantRepository.findById(activePlant1.getId()).orElseThrow();
        assertEquals(5, p1.getStock());

        // Verify cart is intact
        assertEquals(2, cartItemRepository.findByCustomerId(customer1.getId()).size());
    }

    @Test
    void testStockRevalidationScenario() throws Exception {
        String token = jwtService.generateToken(customer1);

        // Cart quantity matches stock initially
        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant1)
                .quantity(5) // matches stock
                .addedAt(LocalDateTime.now())
                .build());

        // Stock changes before checkout finalization
        activePlant1.setStock(3);
        plantRepository.save(activePlant1);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isBadRequest());

        // Verify no orders are created and stock is not deducted further
        assertTrue(orderRepository.findAll().isEmpty());
        Plant p = plantRepository.findById(activePlant1.getId()).orElseThrow();
        assertEquals(3, p.getStock());

        // Verify cart remains intact with original quantity 5
        List<CartItem> cartItems = cartItemRepository.findByCustomerId(customer1.getId());
        assertEquals(1, cartItems.size());
        assertEquals(5, cartItems.get(0).getQuantity());
    }

    @Test
    void testPriceRevalidationRule() throws Exception {
        String token = jwtService.generateToken(customer1);

        // Customer adds item to cart at initial price 100,000 VND
        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant1)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        // Price changes in the database before checkout (admin update)
        activePlant1.setPrice(new BigDecimal("120000"));
        plantRepository.save(activePlant1);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].subtotal", is(240000))) // 120000 * 2
                .andExpect(jsonPath("$[0].totalAmount", is(240000)))
                .andExpect(jsonPath("$[0].details[0].unitPrice", is(120000)));
    }

    @Test
    void testOwnershipProtection() throws Exception {
        String token1 = jwtService.generateToken(customer1);
        String token2 = jwtService.generateToken(customer2);

        // Customer 1 checks out to create an order
        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant1)
                .quantity(1)
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .build();

        String responseStr = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Parse out created order ID
        int orderId = objectMapper.readTree(responseStr).get(0).get("id").asInt();

        // Customer 2 attempts to view Customer 1's order details
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .recipientName("Alice")
                .recipientPhone("0987654321")
                .shippingAddress("456 Blvd")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isUnauthorized());
    }
}
