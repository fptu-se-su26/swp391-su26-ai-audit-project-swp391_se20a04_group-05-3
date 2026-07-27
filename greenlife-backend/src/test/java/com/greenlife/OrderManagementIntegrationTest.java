package com.greenlife;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.category.entity.Category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.order.dto.UpdateOrderStatusRequest;

import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.OrderDetail;

import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.enums.UserStatus;

import com.greenlife.order.repository.OrderRepository;
import com.greenlife.order.repository.OrderDetailRepository;

import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.store.entity.Store;
import com.greenlife.store.repository.StoreRepository;
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
public class OrderManagementIntegrationTest {

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
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail1 = "mgmt_customer1@gmail.com";
    private final String customerEmail2 = "mgmt_customer2@gmail.com";
    private final String storeOwnerEmail1 = "mgmt_storeowner1@gmail.com";
    private final String storeOwnerEmail2 = "mgmt_storeowner2@gmail.com";
    private final String adminEmail = "mgmt_admin@gmail.com";

    private Role customerRole;
    private Role storeOwnerRole;
    private Role adminRole;

    private User customer1;
    private User customer2;
    private User storeOwner1;
    private User storeOwner2;
    private User adminUser;

    private Store store1;
    private Store store2;
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
        storeOwner1 = createUser(storeOwnerEmail1, storeOwnerRole);
        storeOwner2 = createUser(storeOwnerEmail2, storeOwnerRole);
        adminUser = createUser(adminEmail, adminRole);

        store1 = storeRepository.save(Store.builder()
                .owner(storeOwner1)
                .name("Management Store 1")
                .address("Store 1 Address")
                .build());

        store2 = storeRepository.save(Store.builder()
                .owner(storeOwner2)
                .name("Management Store 2")
                .address("Store 2 Address")
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Management Category")
                .slug("mgmt-cat")
                .createdAt(LocalDateTime.now())
                .build());

        plant1 = plantRepository.save(Plant.builder()
                .store(store1)
                .category(category)
                .name("Mgmt Plant 1")
                .slug("mgmt-plant-1")
                .price(new BigDecimal("50000"))
                .stock(10)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        plant2 = plantRepository.save(Plant.builder()
                .store(store2)
                .category(category)
                .name("Mgmt Plant 2")
                .slug("mgmt-plant-2")
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
        orderDetailRepository.deleteAll();
        orderRepository.deleteAll();

        for (Store s : storeRepository.findAll()) {
            if (s.getName().startsWith("Management Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        categoryRepository.findByNameIgnoreCase("Management Category").ifPresent(categoryRepository::delete);

        userRepository.findByEmail(customerEmail1).ifPresent(userRepository::delete);
        userRepository.findByEmail(customerEmail2).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail1).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail2).ifPresent(userRepository::delete);
        userRepository.findByEmail(adminEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Management Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    private Order createOrder(User customer, Store store, OrderStatus status, String paymentMethod, PaymentStatus paymentStatus, Plant plant, int qty) {
        Order order = Order.builder()
                .customer(customer)
                .store(store)
                .recipientName("Recipient")
                .recipientPhone("0900000000")
                .shippingAddress("123 Address")
                .subtotal(plant.getPrice().multiply(BigDecimal.valueOf(qty)))
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(plant.getPrice().multiply(BigDecimal.valueOf(qty)))
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
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
    void testStoreOwnerOrderListingAndSecurity() throws Exception {
        String tokenOwner1 = jwtService.generateToken(storeOwner1);

        Order order1 = createOrder(customer1, store1, OrderStatus.PENDING, "COD", PaymentStatus.PENDING, plant1, 2);
        Order order2 = createOrder(customer2, store2, OrderStatus.PENDING, "COD", PaymentStatus.PENDING, plant2, 1);

        // Owner 1 retrieves orders (should only see order1)
        mockMvc.perform(get("/api/store-owner/orders")
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(order1.getId())));

        // Owner 1 retrieves details of own store order
        mockMvc.perform(get("/api/store-owner/orders/" + order1.getId())
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(order1.getId())));

        // Owner 1 attempts to retrieve details of another store's order (should return 403)
        mockMvc.perform(get("/api/store-owner/orders/" + order2.getId())
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStoreOwnerOrderStatusTransitions() throws Exception {
        String tokenOwner1 = jwtService.generateToken(storeOwner1);
        Order order = createOrder(customer1, store1, OrderStatus.PENDING, "COD", PaymentStatus.PENDING, plant1, 2);

        // PENDING -> CONFIRMED (Allowed)
        UpdateOrderStatusRequest reqConfirmed = UpdateOrderStatusRequest.builder().status("CONFIRMED").build();
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqConfirmed)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // CONFIRMED -> SHIPPING (Allowed)
        UpdateOrderStatusRequest reqShipping = UpdateOrderStatusRequest.builder().status("SHIPPING").build();
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqShipping)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPING")));

        // SHIPPING -> DELIVERED (Allowed) - COD Auto Payment Paid validation
        UpdateOrderStatusRequest reqDelivered = UpdateOrderStatusRequest.builder().status("DELIVERED").build();
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqDelivered)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DELIVERED")))
                .andExpect(jsonPath("$.paymentStatus", is("PAID")));
    }

    @Test
    void testInvalidStoreOrderStatusTransitions() throws Exception {
        String tokenOwner1 = jwtService.generateToken(storeOwner1);
        Order order = createOrder(customer1, store1, OrderStatus.PENDING, "COD", PaymentStatus.PENDING, plant1, 2);

        // PENDING -> SHIPPING (Forbidden) -> should return 400
        UpdateOrderStatusRequest reqShipping = UpdateOrderStatusRequest.builder().status("SHIPPING").build();
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqShipping)))
                .andExpect(status().isBadRequest());

        // Cancel order through cancel endpoint
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // CANCELLED -> CONFIRMED (Forbidden) -> should return 400
        UpdateOrderStatusRequest reqConfirmed = UpdateOrderStatusRequest.builder().status("CONFIRMED").build();
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqConfirmed)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testStoreOwnerCancelAndInventoryRestoration() throws Exception {
        String tokenOwner1 = jwtService.generateToken(storeOwner1);

        // Initial stock of plant1 is 10. During checkout it would be deducted,
        // let's simulate an order containing 3 items.
        // We set plant1 stock to 7 to simulate post-checkout.
        plant1.setStock(7);
        plantRepository.save(plant1);

        Order order = createOrder(customer1, store1, OrderStatus.CONFIRMED, "COD", PaymentStatus.PENDING, plant1, 3);

        // Store owner cancels order
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // Verify stock restored (7 + 3 = 10)
        Plant updatedPlant = plantRepository.findById(plant1.getId()).orElseThrow();
        assertEquals(10, updatedPlant.getStock());
    }

    @Test
    void testCustomerCancelAndInventoryRestoration() throws Exception {
        String tokenCust1 = jwtService.generateToken(customer1);
        String tokenCust2 = jwtService.generateToken(customer2);

        plant1.setStock(6);
        plantRepository.save(plant1);

        Order order = createOrder(customer1, store1, OrderStatus.PENDING, "COD", PaymentStatus.PENDING, plant1, 4);

        // Customer 2 attempts to cancel Customer 1's order (should return 403)
        mockMvc.perform(put("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenCust2))
                .andExpect(status().isForbidden());

        // Customer 1 cancels own PENDING order
        mockMvc.perform(put("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenCust1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // Verify stock restored (6 + 4 = 10)
        Plant updatedPlant = plantRepository.findById(plant1.getId()).orElseThrow();
        assertEquals(10, updatedPlant.getStock());

        // Attempting to cancel already CANCELLED order (should return 400)
        mockMvc.perform(put("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenCust1))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAdminReadPermissionsAndNoMutation() throws Exception {
        String tokenAdmin = jwtService.generateToken(adminUser);
        Order order = createOrder(customer1, store1, OrderStatus.PENDING, "COD", PaymentStatus.PENDING, plant1, 2);

        // Admin views all orders
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        // Admin views specific order details
        mockMvc.perform(get("/api/admin/orders/" + order.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(order.getId())));

        // Admin is forbidden from mutating status via store-owner endpoint (returns 403)
        UpdateOrderStatusRequest reqConfirmed = UpdateOrderStatusRequest.builder().status("CONFIRMED").build();
        mockMvc.perform(put("/api/store-owner/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqConfirmed)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        Order order = createOrder(customer1, store1, OrderStatus.PENDING, "COD", PaymentStatus.PENDING, plant1, 2);

        // No authorization header
        mockMvc.perform(get("/api/store-owner/orders"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/orders/" + order.getId() + "/cancel"))
                .andExpect(status().isUnauthorized());
    }
}
