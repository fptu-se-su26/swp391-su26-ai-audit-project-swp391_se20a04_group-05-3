package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.CheckoutRequest;
import com.greenlife.dto.PaymentUrlRequest;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.OrderStatus;
import com.greenlife.entity.enums.PaymentStatus;
import com.greenlife.entity.enums.PlantStatus;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.*;
import com.greenlife.security.JwtService;
import com.greenlife.util.VNPayUtil;
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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PaymentIntegrationTest {

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

    private final String customerEmail1 = "pay_customer1@gmail.com";
    private final String customerEmail2 = "pay_customer2@gmail.com";
    private final String storeOwnerEmail = "pay_storeowner@gmail.com";

    private Role customerRole;
    private Role storeRole;

    private User customer1;
    private User customer2;
    private User storeOwner;

    private Store store;
    private Category category;
    private Plant activePlant;

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
                .name("Payment Test Store")
                .address("456 Road")
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Payment Plants")
                .slug("payment-plants")
                .createdAt(LocalDateTime.now())
                .build());

        activePlant = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Payment Plant 1")
                .slug("payment-plant-1")
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
        orderDetailRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();

        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Payment Plants")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getCategory() != null && p.getCategory().getId().equals(c.getId())) {
                        plantRepository.delete(p);
                    }
                }
            }
        }

        for (Store s : storeRepository.findAll()) {
            if (s.getName().equalsIgnoreCase("Payment Test Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        categoryRepository.findByNameIgnoreCase("Payment Plants").ifPresent(categoryRepository::delete);

        userRepository.findByEmail(customerEmail1).ifPresent(userRepository::delete);
        userRepository.findByEmail(customerEmail2).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Payment Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testCodOrderCreation() throws Exception {
        String token = jwtService.generateToken(customer1);

        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest request = CheckoutRequest.builder()
                .recipientName("Bob")
                .recipientPhone("0987654321")
                .shippingAddress("789 Street")
                .paymentMethod("COD")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].paymentMethod", is("COD")))
                .andExpect(jsonPath("$[0].paymentStatus", is("PENDING")))
                .andExpect(jsonPath("$[0].status", is("PENDING")))
                .andExpect(jsonPath("$[0].paymentUrl").value(nullValue()));
    }

    @Test
    void testVNPayUrlGenerationAndCheckout() throws Exception {
        String token = jwtService.generateToken(customer1);

        cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant)
                .quantity(1)
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest request = CheckoutRequest.builder()
                .recipientName("Bob")
                .recipientPhone("0987654321")
                .shippingAddress("789 Street")
                .paymentMethod("VNPAY")
                .build();

        // Perform checkout with VNPAY
        String responseStr = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].paymentMethod", is("VNPAY")))
                .andExpect(jsonPath("$[0].paymentStatus", is("PENDING")))
                .andExpect(jsonPath("$[0].paymentUrl", containsString("sandbox.vnpayment.vn")))
                .andReturn().getResponse().getContentAsString();

        int orderId = objectMapper.readTree(responseStr).get(0).get("id").asInt();

        // Now test generating the URL manually through POST /api/payment/vnpay/url
        PaymentUrlRequest urlRequest = PaymentUrlRequest.builder().orderId(orderId).build();
        mockMvc.perform(post("/api/payment/vnpay/url")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(urlRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentUrl", containsString("vnp_SecureHash")));
    }

    @Test
    void testSuccessfulVNPayCallback() throws Exception {
        // Create order directly
        Order order = orderRepository.save(Order.builder()
                .customer(customer1)
                .store(store)
                .recipientName("Bob")
                .recipientPhone("0987654321")
                .shippingAddress("789 Street")
                .paymentMethod("VNPAY")
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .subtotal(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .build());

        // Prepare parameters
        Map<String, String> queryParams = new TreeMap<>();
        queryParams.put("vnp_Amount", "10000000"); // 100,000 * 100
        queryParams.put("vnp_Command", "pay");
        queryParams.put("vnp_CreateDate", "20260618120000");
        queryParams.put("vnp_CurrCode", "VND");
        queryParams.put("vnp_IpAddr", "127.0.0.1");
        queryParams.put("vnp_Locale", "vn");
        queryParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        queryParams.put("vnp_OrderType", "other");
        queryParams.put("vnp_ResponseCode", "00"); // Success response
        queryParams.put("vnp_ReturnUrl", "http://localhost:8080/api/payment/vnpay-callback");
        queryParams.put("vnp_TmnCode", "DUMMY_TMN_CODE");
        queryParams.put("vnp_TxnRef", order.getId() + "_12345");
        queryParams.put("vnp_Version", "2.1.0");

        // Calculate hash
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

        // Request callback GET
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
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus", is("PAID")))
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // Verify database state
        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, updatedOrder.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, updatedOrder.getStatus());
    }

    @Test
    void testFailedVNPayCallback() throws Exception {
        // Create order directly
        Order order = orderRepository.save(Order.builder()
                .customer(customer1)
                .store(store)
                .recipientName("Bob")
                .recipientPhone("0987654321")
                .shippingAddress("789 Street")
                .paymentMethod("VNPAY")
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .subtotal(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .build());

        // Save detail as well to simulate real checkout detail mapping
        orderDetailRepository.save(OrderDetail.builder()
                .order(order)
                .plant(activePlant)
                .productName(activePlant.getName())
                .quantity(2)
                .unitPrice(activePlant.getPrice())
                .lineTotal(new BigDecimal("200000"))
                .build());

        // Prepare failed callback parameters
        Map<String, String> queryParams = new TreeMap<>();
        queryParams.put("vnp_Amount", "10000000");
        queryParams.put("vnp_Command", "pay");
        queryParams.put("vnp_CreateDate", "20260618120000");
        queryParams.put("vnp_CurrCode", "VND");
        queryParams.put("vnp_IpAddr", "127.0.0.1");
        queryParams.put("vnp_Locale", "vn");
        queryParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        queryParams.put("vnp_OrderType", "other");
        queryParams.put("vnp_ResponseCode", "24"); // Cancelled by customer / failed payment
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

        mockMvc.perform(get("/api/payment/vnpay-callback")
                        .param("vnp_Amount", "10000000")
                        .param("vnp_Command", "pay")
                        .param("vnp_CreateDate", "20260618120000")
                        .param("vnp_CurrCode", "VND")
                        .param("vnp_IpAddr", "127.0.0.1")
                        .param("vnp_Locale", "vn")
                        .param("vnp_OrderInfo", "Thanh toan don hang " + order.getId())
                        .param("vnp_OrderType", "other")
                        .param("vnp_ResponseCode", "24")
                        .param("vnp_ReturnUrl", "http://localhost:8080/api/payment/vnpay-callback")
                        .param("vnp_TmnCode", "DUMMY_TMN_CODE")
                        .param("vnp_TxnRef", order.getId() + "_12345")
                        .param("vnp_Version", "2.1.0")
                        .param("vnp_SecureHash", secureHash))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus", is("FAILED")))
                .andExpect(jsonPath("$.status", is("PENDING"))); // remains PENDING

        // Verify stock is NOT restored (inventory remains reserved)
        Plant plant = plantRepository.findById(activePlant.getId()).orElseThrow();
        assertEquals(10, plant.getStock()); // Remains 10

        // Verify order remains retrievable
        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(PaymentStatus.FAILED, updatedOrder.getPaymentStatus());
        assertEquals(OrderStatus.PENDING, updatedOrder.getStatus());
    }

    @Test
    void testDuplicateCallbackProtection() throws Exception {
        Order order = orderRepository.save(Order.builder()
                .customer(customer1)
                .store(store)
                .recipientName("Bob")
                .recipientPhone("0987654321")
                .shippingAddress("789 Street")
                .paymentMethod("VNPAY")
                .paymentStatus(PaymentStatus.PAID) // Already paid
                .status(OrderStatus.CONFIRMED)
                .createdAt(LocalDateTime.now())
                .subtotal(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .build());

        Map<String, String> queryParams = new TreeMap<>();
        queryParams.put("vnp_Amount", "10000000");
        queryParams.put("vnp_Command", "pay");
        queryParams.put("vnp_CreateDate", "20260618120000");
        queryParams.put("vnp_CurrCode", "VND");
        queryParams.put("vnp_IpAddr", "127.0.0.1");
        queryParams.put("vnp_Locale", "vn");
        queryParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        queryParams.put("vnp_OrderType", "other");
        queryParams.put("vnp_ResponseCode", "24"); // Sending failure code this time
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

        mockMvc.perform(get("/api/payment/vnpay-callback")
                        .param("vnp_Amount", "10000000")
                        .param("vnp_Command", "pay")
                        .param("vnp_CreateDate", "20260618120000")
                        .param("vnp_CurrCode", "VND")
                        .param("vnp_IpAddr", "127.0.0.1")
                        .param("vnp_Locale", "vn")
                        .param("vnp_OrderInfo", "Thanh toan don hang " + order.getId())
                        .param("vnp_OrderType", "other")
                        .param("vnp_ResponseCode", "24")
                        .param("vnp_ReturnUrl", "http://localhost:8080/api/payment/vnpay-callback")
                        .param("vnp_TmnCode", "DUMMY_TMN_CODE")
                        .param("vnp_TxnRef", order.getId() + "_12345")
                        .param("vnp_Version", "2.1.0")
                        .param("vnp_SecureHash", secureHash))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus", is("PAID"))) // Stays PAID because update is ignored
                .andExpect(jsonPath("$.status", is("CONFIRMED")));
    }

    @Test
    void testUnauthorizedPaymentAccess() throws Exception {
        String token2 = jwtService.generateToken(customer2); // Logged in as customer 2

        // Create order belonging to customer 1
        Order order = orderRepository.save(Order.builder()
                .customer(customer1)
                .store(store)
                .recipientName("Bob")
                .recipientPhone("0987654321")
                .shippingAddress("789 Street")
                .paymentMethod("VNPAY")
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .subtotal(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .build());

        PaymentUrlRequest urlRequest = PaymentUrlRequest.builder().orderId(order.getId()).build();

        // Customer 2 attempts to generate payment URL for Customer 1's order
        mockMvc.perform(post("/api/payment/vnpay/url")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(urlRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testInvalidSignatureRejection() throws Exception {
        Order order = orderRepository.save(Order.builder()
                .customer(customer1)
                .store(store)
                .recipientName("Bob")
                .recipientPhone("0987654321")
                .shippingAddress("789 Street")
                .paymentMethod("VNPAY")
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .subtotal(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .build());

        // Perform callback with invalid signature
        mockMvc.perform(get("/api/payment/vnpay-callback")
                        .param("vnp_Amount", "10000000")
                        .param("vnp_Command", "pay")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_TmnCode", "DUMMY_TMN_CODE")
                        .param("vnp_TxnRef", order.getId() + "_12345")
                        .param("vnp_Version", "2.1.0")
                        .param("vnp_SecureHash", "INVALID_SIGNATURE_HASH"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Chữ ký thanh toán không hợp lệ")));
    }
}
