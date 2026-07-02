package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.AddressRequest;
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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AddressIntegrationTest {

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
    private CustomerAddressRepository addressRepository;

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

    private final String customerEmailA = "addr_customer_a@gmail.com";
    private final String customerEmailB = "addr_customer_b@gmail.com";
    private final String storeOwnerEmail = "addr_storeowner@gmail.com";

    private Role customerRole;
    private Role storeRole;

    private User customerA;
    private User customerB;
    private User storeOwner;

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

        storeRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("STORE_OWNER")
                        .description("Store Owner Role")
                        .build()));

        cleanupDatabase();

        customerA = createUser(customerEmailA, customerRole);
        customerB = createUser(customerEmailB, customerRole);
        storeOwner = createUser(storeOwnerEmail, storeRole);

        store = storeRepository.save(Store.builder()
                .owner(storeOwner)
                .name("Address Test Store")
                .address("789 Lane")
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Address Flowers")
                .slug("address-flowers")
                .createdAt(LocalDateTime.now())
                .build());

        plant = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Address Plant")
                .slug("address-plant")
                .price(new BigDecimal("50000"))
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
        addressRepository.deleteAll();

        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Address Flowers")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getCategory() != null && p.getCategory().getId().equals(c.getId())) {
                        plantRepository.delete(p);
                    }
                }
            }
        }

        for (Store s : storeRepository.findAll()) {
            if (s.getName().equalsIgnoreCase("Address Test Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        categoryRepository.findByNameIgnoreCase("Address Flowers").ifPresent(categoryRepository::delete);

        userRepository.findByEmail(customerEmailA).ifPresent(userRepository::delete);
        userRepository.findByEmail(customerEmailB).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Address Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testCreateAddressSuccess() throws Exception {
        String token = jwtService.generateToken(customerA);

        AddressRequest request = AddressRequest.builder()
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(false)
                .build();

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.recipientName", is("Nguyen Van A")))
                .andExpect(jsonPath("$.phone", is("0987654321")))
                .andExpect(jsonPath("$.isDefault", is(true))); // Auto-default on first address
    }

    @Test
    void testUpdateAddressSuccess() throws Exception {
        String token = jwtService.generateToken(customerA);

        CustomerAddress address = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        AddressRequest request = AddressRequest.builder()
                .recipientName("Nguyen Van A Edited")
                .phone("0912345678")
                .addressLine("456 Nguyen Chi Thanh")
                .ward("Hai Chau 1")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build();

        mockMvc.perform(put("/api/addresses/" + address.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipientName", is("Nguyen Van A Edited")))
                .andExpect(jsonPath("$.phone", is("0912345678")))
                .andExpect(jsonPath("$.addressLine", is("456 Nguyen Chi Thanh")))
                .andExpect(jsonPath("$.isDefault", is(true)));
    }

    @Test
    void testDeleteAddressSuccess() throws Exception {
        String token = jwtService.generateToken(customerA);

        CustomerAddress address = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        mockMvc.perform(delete("/api/addresses/" + address.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertFalse(addressRepository.findById(address.getId()).isPresent());
    }

    @Test
    void testSetDefaultAddressExplicit() throws Exception {
        String token = jwtService.generateToken(customerA);

        CustomerAddress addressA = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        CustomerAddress addressB = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van B")
                .phone("0987654322")
                .addressLine("456 Hung Vuong")
                .ward("Hai Chau 2")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(false)
                .build());

        mockMvc.perform(put("/api/addresses/" + addressB.getId() + "/default")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDefault", is(true)));

        // Reload from DB to verify old default was unset
        CustomerAddress reloadedA = addressRepository.findById(addressA.getId()).orElseThrow();
        CustomerAddress reloadedB = addressRepository.findById(addressB.getId()).orElseThrow();

        assertFalse(reloadedA.getIsDefault());
        assertTrue(reloadedB.getIsDefault());
    }

    @Test
    void testReplacePreviousDefaultViaRequest() throws Exception {
        String token = jwtService.generateToken(customerA);

        CustomerAddress addressA = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        CustomerAddress addressB = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van B")
                .phone("0987654322")
                .addressLine("456 Hung Vuong")
                .ward("Hai Chau 2")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(false)
                .build());

        AddressRequest request = AddressRequest.builder()
                .recipientName("Nguyen Van B")
                .phone("0987654322")
                .addressLine("456 Hung Vuong")
                .ward("Hai Chau 2")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build();

        mockMvc.perform(put("/api/addresses/" + addressB.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        CustomerAddress reloadedA = addressRepository.findById(addressA.getId()).orElseThrow();
        CustomerAddress reloadedB = addressRepository.findById(addressB.getId()).orElseThrow();

        assertFalse(reloadedA.getIsDefault());
        assertTrue(reloadedB.getIsDefault());
    }

    @Test
    void testOwnershipProtection() throws Exception {
        String tokenA = jwtService.generateToken(customerA);

        CustomerAddress addressB = addressRepository.save(CustomerAddress.builder()
                .customer(customerB)
                .recipientName("Nguyen Van B")
                .phone("0987654322")
                .addressLine("456 Hung Vuong")
                .ward("Hai Chau 2")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        // Customer A tries to update Customer B's address
        AddressRequest request = AddressRequest.builder()
                .recipientName("Hack Name")
                .phone("0987654322")
                .addressLine("456 Hung Vuong")
                .ward("Hai Chau 2")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build();

        mockMvc.perform(put("/api/addresses/" + addressB.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        // Customer A tries to set default on Customer B's address
        mockMvc.perform(put("/api/addresses/" + addressB.getId() + "/default")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());

        // Customer A tries to delete Customer B's address
        mockMvc.perform(delete("/api/addresses/" + addressB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCheckoutUsingAddressId() throws Exception {
        String token = jwtService.generateToken(customerA);

        CustomerAddress address = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        // Add item to cart
        cartItemRepository.save(CartItem.builder()
                .customer(customerA)
                .plant(plant)
                .quantity(1)
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(address.getId())
                .note("Address Book Checkout Test")
                .build();

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].recipientName", is("Nguyen Van A")))
                .andExpect(jsonPath("$[0].recipientPhone", is("0987654321")))
                .andExpect(jsonPath("$[0].shippingAddress", is("123 Le Loi, Thach Thang, Hai Chau, Da Nang")));
    }

    @Test
    void testAddressSnapshotPersistence() throws Exception {
        String token = jwtService.generateToken(customerA);

        CustomerAddress address = addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        // Add item to cart
        cartItemRepository.save(CartItem.builder()
                .customer(customerA)
                .plant(plant)
                .quantity(1)
                .addedAt(LocalDateTime.now())
                .build());

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(address.getId())
                .build();

        String responseStr = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        int orderId = objectMapper.readTree(responseStr).get(0).get("id").asInt();

        // Edit address book entry
        address.setRecipientName("Nguyen Van A Edited");
        address.setPhone("0912345678");
        address.setAddressLine("999 New Road");
        addressRepository.save(address);

        // Delete address book entry
        addressRepository.delete(address);

        // Verify order history retains the snapshot!
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertEquals("Nguyen Van A", order.getRecipientName());
        assertEquals("0987654321", order.getRecipientPhone());
        assertEquals("123 Le Loi, Thach Thang, Hai Chau, Da Nang", order.getShippingAddress());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/addresses"))
                .andExpect(status().isUnauthorized());

        AddressRequest request = AddressRequest.builder()
                .recipientName("Anonymous")
                .phone("0987654321")
                .addressLine("123 St")
                .ward("W")
                .district("D")
                .city("C")
                .build();

        mockMvc.perform(post("/api/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testInvalidPhoneValidation() throws Exception {
        String token = jwtService.generateToken(customerA);

        AddressRequest request = AddressRequest.builder()
                .recipientName("Nguyen Van A")
                .phone("12345") // Invalid regex pattern
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .build();

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @SuppressWarnings("null")
    void testConcurrentDefaultAddressUpdate() throws Exception {
        String token = jwtService.generateToken(customerA);

        List<CustomerAddress> addresses = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            addresses.add(addressRepository.save(CustomerAddress.builder()
                    .customer(customerA)
                    .recipientName("Nguyen Van " + i)
                    .phone("0987654321")
                    .addressLine(i + " Le Loi")
                    .ward("Thach Thang")
                    .district("Hai Chau")
                    .city("Da Nang")
                    .isDefault(i == 0)
                    .build()));
        }

        ExecutorService executorService = Executors.newFixedThreadPool(4);
        for (int i = 1; i <= 4; i++) {
            final int index = i;
            executorService.submit(() -> {
                try {
                    mockMvc.perform(put("/api/addresses/" + addresses.get(index).getId() + "/default")
                            .header("Authorization", "Bearer " + token));
                } catch (Exception e) {
                    // Ignore concurrent exceptions in thread
                }
            });
        }

        executorService.shutdown();
        assertTrue(executorService.awaitTermination(5, TimeUnit.SECONDS));

        // Verify that exactly one address remains default
        List<CustomerAddress> reloaded = addressRepository.findByCustomerIdOrderByIsDefaultDescUpdatedAtDescCreatedAtDesc(customerA.getId());
        long defaultCount = reloaded.stream().filter(CustomerAddress::getIsDefault).count();
        assertEquals(1, defaultCount);
    }

    @Test
    void testPaginationAndSorting() throws Exception {
        String token = jwtService.generateToken(customerA);

        addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van A")
                .phone("0987654321")
                .addressLine("123 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(true)
                .build());

        addressRepository.save(CustomerAddress.builder()
                .customer(customerA)
                .recipientName("Nguyen Van B")
                .phone("0987654321")
                .addressLine("456 Hung Vuong")
                .ward("Hai Chau 2")
                .district("Hai Chau")
                .city("Da Nang")
                .isDefault(false)
                .build());

        mockMvc.perform(get("/api/addresses")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].recipientName", is("Nguyen Van A"))) // default first
                .andExpect(jsonPath("$[1].recipientName", is("Nguyen Van B")));
    }

    @Test
    void testExceedMaxAddressesLimit() throws Exception {
        String token = jwtService.generateToken(customerA);

        // Prepopulate with 10 addresses
        for (int i = 0; i < 10; i++) {
            addressRepository.save(CustomerAddress.builder()
                    .customer(customerA)
                    .recipientName("Nguyen Van " + i)
                    .phone("0987654321")
                    .addressLine(i + " Le Loi")
                    .ward("Thach Thang")
                    .district("Hai Chau")
                    .city("Da Nang")
                    .isDefault(i == 0)
                    .build());
        }

        AddressRequest request = AddressRequest.builder()
                .recipientName("Address Eleven")
                .phone("0987654321")
                .addressLine("11 Le Loi")
                .ward("Thach Thang")
                .district("Hai Chau")
                .city("Da Nang")
                .build();

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Vượt quá số lượng địa chỉ tối đa cho phép")));
    }
}
