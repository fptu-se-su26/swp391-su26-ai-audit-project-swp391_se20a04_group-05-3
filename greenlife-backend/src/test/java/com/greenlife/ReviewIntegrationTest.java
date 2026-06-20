package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.ReviewRequest;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.OrderStatus;
import com.greenlife.entity.enums.PaymentStatus;
import com.greenlife.entity.enums.PlantStatus;
import com.greenlife.entity.enums.ReviewStatus;
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
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ReviewIntegrationTest {

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
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail1 = "rev_customer1@gmail.com";
    private final String customerEmail2 = "rev_customer2@gmail.com";
    private final String storeOwnerEmail = "rev_storeowner@gmail.com";
    private final String adminEmail = "rev_admin@gmail.com";

    private Role customerRole;
    private Role storeOwnerRole;
    private Role adminRole;

    private User customer1;
    private User customer2;
    private User storeOwner;
    private User adminUser;

    private Store store;
    private Category category;
    private Plant plant1;
    private Plant plant2;

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

        customer1 = createUser(customerEmail1, customerRole);
        customer2 = createUser(customerEmail2, customerRole);
        storeOwner = createUser(storeOwnerEmail, storeOwnerRole);
        adminUser = createUser(adminEmail, adminRole);

        store = storeRepository.save(Store.builder()
                .owner(storeOwner)
                .name("Review Store")
                .address("Review Address")
                .status(com.greenlife.entity.enums.StoreStatus.APPROVED)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Review Category")
                .slug("rev-cat")
                .createdAt(LocalDateTime.now())
                .build());

        plant1 = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Rev Plant 1")
                .slug("rev-plant-1")
                .price(new BigDecimal("50000"))
                .stock(10)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        plant2 = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Rev Plant 2")
                .slug("rev-plant-2")
                .price(new BigDecimal("100000"))
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        reviewRepository.deleteAll();
        orderDetailRepository.deleteAll();
        orderRepository.deleteAll();

        for (Store s : storeRepository.findAll()) {
            if (s.getName().startsWith("Review Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        categoryRepository.findByNameIgnoreCase("Review Category").ifPresent(categoryRepository::delete);

        userRepository.findByEmail(customerEmail1).ifPresent(userRepository::delete);
        userRepository.findByEmail(customerEmail2).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Review Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    private Order createOrder(User customer, Store store, OrderStatus status, Plant plant, int qty) {
        Order order = Order.builder()
                .customer(customer)
                .store(store)
                .recipientName("Recipient")
                .recipientPhone("0900000000")
                .shippingAddress("123 Address")
                .subtotal(plant.getPrice().multiply(BigDecimal.valueOf(qty)))
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(plant.getPrice().multiply(BigDecimal.valueOf(qty)))
                .paymentMethod("COD")
                .paymentStatus(PaymentStatus.PENDING)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();

        order = orderRepository.save(order);

        OrderDetail detail = OrderDetail.builder()
                .order(order)
                .plant(plant)
                .productName(plant.getName())
                .quantity(qty)
                .unitPrice(plant.getPrice())
                .lineTotal(plant.getPrice().multiply(BigDecimal.valueOf(qty)))
                .build();

        orderDetailRepository.save(detail);
        order.getOrderDetails().add(detail);
        return orderRepository.save(order);
    }

    @Test
    void testPurchaseVerificationForReviews() throws Exception {
        String tokenCust1 = jwtService.generateToken(customer1);

        ReviewRequest request = ReviewRequest.builder()
                .plantId(plant1.getId())
                .rating(5)
                .comment("Excellent quality!")
                .build();

        // 1. Try to review without any purchase -> should return 400
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng thành công")));

        // 2. Create order but with PENDING status -> should return 400
        createOrder(customer1, store, OrderStatus.PENDING, plant1, 1);
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // 3. Update order status to DELIVERED -> should succeed
        orderRepository.deleteAll();
        orderDetailRepository.deleteAll();
        createOrder(customer1, store, OrderStatus.DELIVERED, plant1, 1);

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.customerDisplayName", is(customer1.getFullName())))
                .andExpect(jsonPath("$.customerId").doesNotExist()); // Public privacy: customerId must not exist
    }

    @Test
    void testDuplicateReviewProtection() throws Exception {
        String tokenCust1 = jwtService.generateToken(customer1);
        createOrder(customer1, store, OrderStatus.DELIVERED, plant1, 1);

        ReviewRequest request = ReviewRequest.builder()
                .plantId(plant1.getId())
                .rating(4)
                .comment("Very good")
                .build();

        // First review
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Second review (duplicate) -> should return 400
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Bạn đã đánh giá sản phẩm này rồi")));
    }

    @Test
    void testRatingBoundaryAndValidation() throws Exception {
        String tokenCust1 = jwtService.generateToken(customer1);
        createOrder(customer1, store, OrderStatus.DELIVERED, plant1, 1);

        // Rating > 5 -> should return 400
        ReviewRequest requestTooHigh = ReviewRequest.builder()
                .plantId(plant1.getId())
                .rating(6)
                .comment("Super perfect")
                .build();

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestTooHigh)))
                .andExpect(status().isBadRequest());

        // Rating < 1 -> should return 400
        ReviewRequest requestTooLow = ReviewRequest.builder()
                .plantId(plant1.getId())
                .rating(0)
                .comment("Horrible")
                .build();

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestTooLow)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testOwnershipValidationOnUpdateAndDelete() throws Exception {
        String tokenCust1 = jwtService.generateToken(customer1);
        String tokenCust2 = jwtService.generateToken(customer2);

        createOrder(customer1, store, OrderStatus.DELIVERED, plant1, 1);

        ReviewRequest request = ReviewRequest.builder()
                .plantId(plant1.getId())
                .rating(4)
                .comment("Okay")
                .build();

        // Customer 1 creates review
        String responseStr = mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer reviewId = objectMapper.readTree(responseStr).get("id").asInt();

        // Customer 2 attempts to edit Customer 1's review -> should return 403
        ReviewRequest updateRequest = ReviewRequest.builder()
                .rating(2)
                .comment("Actually bad")
                .build();

        mockMvc.perform(put("/api/reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenCust2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());

        // Customer 2 attempts to delete Customer 1's review -> should return 403
        mockMvc.perform(delete("/api/reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenCust2))
                .andExpect(status().isForbidden());

        // Customer 1 successfully edits own review
        mockMvc.perform(put("/api/reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenCust1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating", is(2)))
                .andExpect(jsonPath("$.comment", is("Actually bad")));

        // Customer 1 successfully deletes own review
        mockMvc.perform(delete("/api/reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenCust1))
                .andExpect(status().isNoContent());
    }

    @Test
    void testRatingAggregationAndAverages() throws Exception {
        // Customer 1 reviews plant1 (rating: 5)
        createOrder(customer1, store, OrderStatus.DELIVERED, plant1, 1);
        reviewRepository.save(Review.builder()
                .customer(customer1)
                .plant(plant1)
                .rating(5)
                .comment("Great")
                .status(ReviewStatus.VISIBLE)
                .build());

        // Customer 2 reviews plant1 (rating: 3)
        createOrder(customer2, store, OrderStatus.DELIVERED, plant1, 1);
        reviewRepository.save(Review.builder()
                .customer(customer2)
                .plant(plant1)
                .rating(3)
                .comment("Average")
                .status(ReviewStatus.VISIBLE)
                .build());

        // Get plant 1 summary -> should return avg 4.0, total 2
        mockMvc.perform(get("/api/reviews/plants/" + plant1.getId() + "/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating", is(4.0)))
                .andExpect(jsonPath("$.totalReviews", is(2)));
    }

    @Test
    void testAdminModerationAndHiding() throws Exception {
        String tokenAdmin = jwtService.generateToken(adminUser);
        createOrder(customer1, store, OrderStatus.DELIVERED, plant1, 1);

        Review review = reviewRepository.save(Review.builder()
                .customer(customer1)
                .plant(plant1)
                .rating(1)
                .comment("Spam comment")
                .status(ReviewStatus.VISIBLE)
                .build());

        // Admin changes status to HIDDEN
        Map<String, String> payload = new HashMap<>();
        payload.put("status", "HIDDEN");

        mockMvc.perform(put("/api/admin/reviews/" + review.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("HIDDEN")));

        // Verify hidden review is excluded from public GET view
        mockMvc.perform(get("/api/reviews/plants/" + plant1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void testStoreOwnerAccessRestrictions() throws Exception {
        String tokenOwner = jwtService.generateToken(storeOwner);
        createOrder(customer1, store, OrderStatus.DELIVERED, plant1, 1);

        Review review = reviewRepository.save(Review.builder()
                .customer(customer1)
                .plant(plant1)
                .rating(4)
                .comment("Nice")
                .status(ReviewStatus.VISIBLE)
                .build());

        // 1. Store Owner lists reviews of their store
        mockMvc.perform(get("/api/store-owner/reviews")
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].comment", is("Nice")));

        // 2. Store Owner attempts to moderate review status -> should return 403
        Map<String, String> payload = new HashMap<>();
        payload.put("status", "HIDDEN");

        mockMvc.perform(put("/api/admin/reviews/" + review.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden());
    }
}
