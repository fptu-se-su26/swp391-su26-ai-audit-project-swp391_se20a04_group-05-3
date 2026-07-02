package com.greenlife;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.category.entity.Category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.BroadcastRequest;
import com.greenlife.dto.CartItemRequest;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.*;
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

import com.greenlife.util.VNPayUtil;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class NotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private NotificationRepository notificationRepository;

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
    private WishlistRepository wishlistRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail = "notif_customer@gmail.com";
    private final String storeOwnerEmail = "notif_owner@gmail.com";
    private final String adminEmail = "notif_admin@gmail.com";
    private final String otherEmail = "notif_other@gmail.com";

    private Role customerRole;
    private Role storeOwnerRole;
    private Role adminRole;

    private User customer;
    private User storeOwner;
    private User adminUser;
    private User otherCustomer;

    private Store store;
    private Category category;
    private Plant plant;

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
        otherCustomer = createUser(otherEmail, customerRole);

        store = storeRepository.save(Store.builder()
                .owner(storeOwner)
                .name("Notif Store")
                .address("Notif Address")
                .status(StoreStatus.APPROVED)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Notif Category")
                .slug("notif-cat")
                .createdAt(LocalDateTime.now())
                .build());

        plant = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Notif Plant")
                .slug("notif-plant")
                .price(new BigDecimal("100000"))
                .stock(10)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        notificationRepository.deleteAll();
        cartItemRepository.deleteAll();
        wishlistRepository.deleteAll();
        reviewRepository.deleteAll();
        orderDetailRepository.deleteAll();
        orderRepository.deleteAll();

        for (Store s : storeRepository.findAll()) {
            if (s.getName().startsWith("Notif Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        categoryRepository.findByNameIgnoreCase("Notif Category").ifPresent(categoryRepository::delete);

        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
        userRepository.findByEmail(otherEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Notif Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    private Order createOrder(User customer, OrderStatus status) {
        Order order = Order.builder()
                .customer(customer)
                .store(store)
                .recipientName("Recipient")
                .recipientPhone("0987654321")
                .shippingAddress("Address")
                .subtotal(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .paymentMethod("COD")
                .paymentStatus(PaymentStatus.PENDING)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
        return orderRepository.save(order);
    }

    private void waitForNotifications(long expectedCount) {
        long start = System.currentTimeMillis();
        while (System.currentTimeMillis() - start < 3000) {
            if (notificationRepository.count() >= expectedCount) {
                return;
            }
            try { Thread.sleep(50); } catch (InterruptedException ignored) {}
        }
    }

    @Test
    void testNotificationOnCheckoutAndStatusTransitions() throws Exception {
        String customerToken = jwtService.generateToken(customer);
        String ownerToken = jwtService.generateToken(storeOwner);

        // 1. Checkout (ORDER_CREATED event triggers)
        // Let's perform a checkout request using mockMvc
        // Add a cart item first
        CartItemRequest cartItemRequest = CartItemRequest.builder()
                .plantId(plant.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cartItemRequest))
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        // Checkout:
        Map<String, Object> checkoutRequest = new HashMap<>();
        checkoutRequest.put("recipientName", "Recipient");
        checkoutRequest.put("recipientPhone", "0987654321");
        checkoutRequest.put("shippingAddress", "123 Street");
        checkoutRequest.put("paymentMethod", "COD");

        mockMvc.perform(post("/api/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest))
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        // Wait for async listeners
        waitForNotifications(2); // One for customer (ORDER_CREATED), one for store owner (ORDER_CREATED)

        // Retrieve notifications for customer
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("ORDER_CREATED")))
                .andExpect(jsonPath("$.content[0].title", containsString("Đơn hàng mới đã được tạo")))
                .andExpect(jsonPath("$.content[0].userId").doesNotExist()); // Verification: Do NOT expose userId

        // Retrieve notifications for store owner
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("ORDER_CREATED")))
                .andExpect(jsonPath("$.content[0].title", containsString("Có đơn hàng mới")));

        // Get the order ID
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        assertFalse(orders.isEmpty());
        Integer orderId = orders.get(0).getId();

        // 2. Order Confirmation: Store owner confirms
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", "CONFIRMED");
        mockMvc.perform(put("/api/store-owner/orders/" + orderId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate))
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        waitForNotifications(3); // +1 (ORDER_CONFIRMED for customer)

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].type", is("ORDER_CONFIRMED")));

        // 3. Shipping: Store owner updates to SHIPPING
        statusUpdate.put("status", "SHIPPING");
        mockMvc.perform(put("/api/store-owner/orders/" + orderId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate))
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        waitForNotifications(4); // +1 (ORDER_SHIPPING for customer)

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].type", is("ORDER_SHIPPING")));

        // 4. Delivered: Store owner updates to DELIVERED
        statusUpdate.put("status", "DELIVERED");
        mockMvc.perform(put("/api/store-owner/orders/" + orderId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate))
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        waitForNotifications(6); // +2 (ORDER_DELIVERED for customer & PAYMENT_SUCCESS for COD delivered customer)

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.content[*].type", hasItems("PAYMENT_SUCCESS", "ORDER_DELIVERED")));
    }

    @Test
    void testNotificationOnCancelByCustomer() throws Exception {
        String customerToken = jwtService.generateToken(customer);
        String ownerToken = jwtService.generateToken(storeOwner);

        Order order = createOrder(customer, OrderStatus.PENDING);

        // Cancel order as customer
        mockMvc.perform(put("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        waitForNotifications(2); // One for customer (ORDER_CANCELLED), one for store owner (ORDER_CANCELLED)

        // Customer check
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("ORDER_CANCELLED")));

        // Owner check
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("ORDER_CANCELLED")));
    }

    @Test
    void testNotificationOnCancelByOwner() throws Exception {
        String customerToken = jwtService.generateToken(customer);
        String ownerToken = jwtService.generateToken(storeOwner);

        Order order = createOrder(customer, OrderStatus.PENDING);

        // Cancel order as owner
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        waitForNotifications(2); // Customer + Store Owner cancel notifications

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("ORDER_CANCELLED")));
    }

    @Test
    void testNotificationOnPaymentCallback() throws Exception {
        String customerToken = jwtService.generateToken(customer);
        Order order = createOrder(customer, OrderStatus.PENDING);

        // Prepare parameters
        Map<String, String> queryParams = new TreeMap<>();
        queryParams.put("vnp_Amount", "10000000");
        queryParams.put("vnp_Command", "pay");
        queryParams.put("vnp_CreateDate", "20260618120000");
        queryParams.put("vnp_CurrCode", "VND");
        queryParams.put("vnp_IpAddr", "127.0.0.1");
        queryParams.put("vnp_Locale", "vn");
        queryParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        queryParams.put("vnp_OrderType", "other");
        queryParams.put("vnp_ResponseCode", "00");
        queryParams.put("vnp_ReturnUrl", "http://localhost:8080/api/payment/vnpay-callback");
        queryParams.put("vnp_TmnCode", "DUMMY_TMN_CODE");
        queryParams.put("vnp_TxnRef", order.getId() + "_12345");
        queryParams.put("vnp_Version", "2.1.0");

        StringBuilder hashData = new StringBuilder();
        Iterator<String> it = queryParams.keySet().iterator();
        while (it.hasNext()) {
            String k = it.next();
            String v = queryParams.get(k);
            hashData.append(k).append('=').append(URLEncoder.encode(v, StandardCharsets.US_ASCII));
            if (it.hasNext()) {
                hashData.append('&');
            }
        }
        String secureHash = VNPayUtil.hmacSHA512("DUMMY_HASH_SECRET", hashData.toString());

        // Simulate successful VNPay callback
        mockMvc.perform(get("/api/payment/vnpay-callback")
                        .param("vnp_Amount", "10000000")
                        .param("vnp_Command", "pay")
                        .param("vnp_CreateDate", "20260618120000")
                        .param("vnp_CurrCode", "VND")
                        .param("vnp_IpAddr", "127.0.0.1")
                        .param("vnp_Locale", "vn")
                        .param("vnp_OrderInfo", "Thanh toan don hang " + order.getId())
                        .param("vnp_OrderType", "other")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_ReturnUrl", "http://localhost:8080/api/payment/vnpay-callback")
                        .param("vnp_TmnCode", "DUMMY_TMN_CODE")
                        .param("vnp_TxnRef", order.getId() + "_12345")
                        .param("vnp_Version", "2.1.0")
                        .param("vnp_SecureHash", secureHash))
                .andExpect(status().isOk());

        waitForNotifications(2); // PAYMENT_SUCCESS + ORDER_CONFIRMED

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].type", hasItems("ORDER_CONFIRMED", "PAYMENT_SUCCESS")));

        // Simulate failed VNPay callback (for another order)
        Order order2 = createOrder(customer, OrderStatus.PENDING);
        queryParams.put("vnp_OrderInfo", "Thanh toan don hang " + order2.getId());
        queryParams.put("vnp_ResponseCode", "24");
        queryParams.put("vnp_TxnRef", order2.getId() + "_12345");

        hashData = new StringBuilder();
        it = queryParams.keySet().iterator();
        while (it.hasNext()) {
            String k = it.next();
            String v = queryParams.get(k);
            hashData.append(k).append('=').append(URLEncoder.encode(v, StandardCharsets.US_ASCII));
            if (it.hasNext()) {
                hashData.append('&');
            }
        }
        String secureHash2 = VNPayUtil.hmacSHA512("DUMMY_HASH_SECRET", hashData.toString());

        mockMvc.perform(get("/api/payment/vnpay-callback")
                        .param("vnp_Amount", "10000000")
                        .param("vnp_Command", "pay")
                        .param("vnp_CreateDate", "20260618120000")
                        .param("vnp_CurrCode", "VND")
                        .param("vnp_IpAddr", "127.0.0.1")
                        .param("vnp_Locale", "vn")
                        .param("vnp_OrderInfo", "Thanh toan don hang " + order2.getId())
                        .param("vnp_OrderType", "other")
                        .param("vnp_ResponseCode", "24")
                        .param("vnp_ReturnUrl", "http://localhost:8080/api/payment/vnpay-callback")
                        .param("vnp_TmnCode", "DUMMY_TMN_CODE")
                        .param("vnp_TxnRef", order2.getId() + "_12345")
                        .param("vnp_Version", "2.1.0")
                        .param("vnp_SecureHash", secureHash2))
                .andExpect(status().isOk());

        waitForNotifications(3); // Previous 2 + PAYMENT_FAILED

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].type", is("PAYMENT_FAILED")));
    }

    @Test
    void testNotificationOnReviewModeration() throws Exception {
        String customerToken = jwtService.generateToken(customer);
        String adminToken = jwtService.generateToken(adminUser);

        // Create a review
        Review review = reviewRepository.save(Review.builder()
                .customer(customer)
                .plant(plant)
                .rating(5)
                .comment("Great plant!")
                .status(ReviewStatus.VISIBLE)
                .build());

        // Admin hides the review
        Map<String, String> payload = new HashMap<>();
        payload.put("status", "HIDDEN");
        mockMvc.perform(put("/api/admin/reviews/" + review.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        waitForNotifications(1);

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("REVIEW_HIDDEN")))
                .andExpect(jsonPath("$.content[0].title", containsString("Đánh giá của bạn đã bị ẩn")));
    }

    @Test
    void testNotificationOnWishlistRestock() throws Exception {
        String customerToken = jwtService.generateToken(customer);

        // Add to wishlist
        mockMvc.perform(post("/api/wishlist/" + plant.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isCreated());

        // Make plant out of stock
        plant.setStock(0);
        plant.setStatus(PlantStatus.OUT_OF_STOCK);
        plantRepository.save(plant);

        // Update plant back to active with positive stock
        Map<String, Object> updateRequest = new HashMap<>();
        updateRequest.put("storeId", store.getId());
        updateRequest.put("categoryId", category.getId());
        updateRequest.put("name", "Notif Plant");
        updateRequest.put("slug", "notif-plant");
        updateRequest.put("price", 100000);
        updateRequest.put("stock", 15);
        updateRequest.put("status", "ACTIVE");

        String adminToken = jwtService.generateToken(adminUser);
        mockMvc.perform(put("/api/admin/products/" + plant.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        waitForNotifications(1);

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("WISHLIST_RESTOCK")))
                .andExpect(jsonPath("$.content[0].title", containsString("Sản phẩm yêu thích đã có hàng trở lại")));
    }

    @Test
    void testMarkAsRead() throws Exception {
        String customerToken = jwtService.generateToken(customer);

        // Create a notification
        Notification notif = notificationRepository.save(Notification.builder()
                .user(customer)
                .type(NotificationType.SYSTEM_ANNOUNCEMENT)
                .title("Announce")
                .message("Msg")
                .referenceType(NotificationReferenceType.SYSTEM)
                .referenceId(0)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build());

        // Check unread count is 1
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(1)));

        // Mark as read
        mockMvc.perform(put("/api/notifications/" + notif.getId() + "/read")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read", is(true)))
                .andExpect(jsonPath("$.readAt", notNullValue()));

        // Check unread count is 0
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(0)));
    }

    @Test
    void testMarkAllAsRead() throws Exception {
        String customerToken = jwtService.generateToken(customer);

        // Create multiple notifications
        for (int i = 0; i < 5; i++) {
            notificationRepository.save(Notification.builder()
                    .user(customer)
                    .type(NotificationType.SYSTEM_ANNOUNCEMENT)
                    .title("Announce " + i)
                    .message("Msg")
                    .referenceType(NotificationReferenceType.SYSTEM)
                    .referenceId(0)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(5)));

        // Mark all as read
        mockMvc.perform(put("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(0)));
    }

    @Test
    void testDeleteNotification() throws Exception {
        String customerToken = jwtService.generateToken(customer);

        Notification notif = notificationRepository.save(Notification.builder()
                .user(customer)
                .type(NotificationType.SYSTEM_ANNOUNCEMENT)
                .title("Delete Me")
                .message("Msg")
                .referenceType(NotificationReferenceType.SYSTEM)
                .referenceId(0)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build());

        // Delete
        mockMvc.perform(delete("/api/notifications/" + notif.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void testOwnershipSecurity() throws Exception {
        String otherToken = jwtService.generateToken(otherCustomer);

        Notification notif = notificationRepository.save(Notification.builder()
                .user(customer)
                .type(NotificationType.SYSTEM_ANNOUNCEMENT)
                .title("Customer A Notif")
                .message("Msg")
                .referenceType(NotificationReferenceType.SYSTEM)
                .referenceId(0)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build());

        // Customer B tries to read Customer A's notification -> Forbidden
        mockMvc.perform(put("/api/notifications/" + notif.getId() + "/read")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        // Customer B tries to delete Customer A's notification -> Forbidden
        mockMvc.perform(delete("/api/notifications/" + notif.getId())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminBroadcastAndAudit() throws Exception {
        String customerToken = jwtService.generateToken(customer);
        String otherToken = jwtService.generateToken(otherCustomer);
        String adminToken = jwtService.generateToken(adminUser);

        BroadcastRequest broadcast = BroadcastRequest.builder()
                .title("Global Alert")
                .message("System undergoing maintenance.")
                .build();

        // Perform broadcast as admin
        mockMvc.perform(post("/api/admin/notifications/broadcast")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(broadcast))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify customer received it
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("SYSTEM_ANNOUNCEMENT")))
                .andExpect(jsonPath("$.content[0].title", is("Global Alert")));

        // Verify other customer received it
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].type", is("SYSTEM_ANNOUNCEMENT")));

        // Verify admin audit log retrieves it
        mockMvc.perform(get("/api/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void testPaginationCappingAndSorting() throws Exception {
        String customerToken = jwtService.generateToken(customer);

        // Generate 120 notifications for the customer
        LocalDateTime start = LocalDateTime.now();
        for (int i = 0; i < 120; i++) {
            notificationRepository.save(Notification.builder()
                    .user(customer)
                    .type(NotificationType.SYSTEM_ANNOUNCEMENT)
                    .title("Announce " + i)
                    .message("Msg")
                    .referenceType(NotificationReferenceType.SYSTEM)
                    .referenceId(0)
                    .isRead(false)
                    .createdAt(start.plusSeconds(i)) // Ensure strictly increasing timestamp
                    .build());
        }

        // Request size = 150, should be capped at 100
        mockMvc.perform(get("/api/notifications?page=0&size=150")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(100)))
                .andExpect(jsonPath("$.content[0].title", is("Announce 119"))) // Sorted by createdAt DESC
                .andExpect(jsonPath("$.content[99].title", is("Announce 20")));
    }

    @Test
    void testUnauthorizedEndpoints() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testNonAdminForbiddenForBroadcast() throws Exception {
        String customerToken = jwtService.generateToken(customer);

        BroadcastRequest broadcast = BroadcastRequest.builder()
                .title("Alert")
                .message("Msg")
                .build();

        mockMvc.perform(post("/api/admin/notifications/broadcast")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(broadcast))
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}
