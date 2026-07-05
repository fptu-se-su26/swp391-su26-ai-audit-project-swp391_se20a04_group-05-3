package com.greenlife;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.category.entity.Category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.order.dto.CartItemRequest;
import com.greenlife.order.dto.CartItemUpdateRequest;

import com.greenlife.order.entity.CartItem;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.enums.UserStatus;

import com.greenlife.order.repository.CartItemRepository;
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
public class CartIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail1 = "cart_customer1@gmail.com";
    private final String customerEmail2 = "cart_customer2@gmail.com";
    private final String storeOwnerEmail = "cart_storeowner@gmail.com";

    private Role customerRole;
    private Role storeRole;

    private User customer1;
    private User customer2;
    private User storeOwner;

    private Store store;
    private Category category;
    private Plant activePlant;
    private Plant inactivePlant;

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
                .name("Cart Test Store")
                .address("123 Street")
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Cart Succulents")
                .slug("cart-succulents")
                .createdAt(LocalDateTime.now())
                .build());

        activePlant = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Cart Jade Plant")
                .slug("cart-jade-plant")
                .price(new BigDecimal("100000"))
                .stock(5)
                .status(PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        inactivePlant = plantRepository.save(Plant.builder()
                .store(store)
                .category(category)
                .name("Inactive Jade Plant")
                .slug("inactive-jade")
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
        // 1. Delete all cart items first
        cartItemRepository.deleteAll();

        // 2. Delete plants referencing our test category or store
        for (Category c : categoryRepository.findAll()) {
            if (c.getName().equalsIgnoreCase("Cart Succulents")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getCategory() != null && p.getCategory().getId().equals(c.getId())) {
                        plantRepository.delete(p);
                    }
                }
            }
        }

        for (Store s : storeRepository.findAll()) {
            if (s.getName().equalsIgnoreCase("Cart Test Store")) {
                for (Plant p : plantRepository.findAll()) {
                    if (p.getStore() != null && p.getStore().getId().equals(s.getId())) {
                        plantRepository.delete(p);
                    }
                }
                storeRepository.delete(s);
            }
        }

        // 3. Delete category
        categoryRepository.findByNameIgnoreCase("Cart Succulents").ifPresent(categoryRepository::delete);

        // 4. Delete users
        userRepository.findByEmail(customerEmail1).ifPresent(userRepository::delete);
        userRepository.findByEmail(customerEmail2).ifPresent(userRepository::delete);
        userRepository.findByEmail(storeOwnerEmail).ifPresent(userRepository::delete);
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Cart Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testAddCartItemSuccess() throws Exception {
        String token = jwtService.generateToken(customer1);

        CartItemRequest request = CartItemRequest.builder()
                .plantId(activePlant.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.plantId", is(activePlant.getId())))
                .andExpect(jsonPath("$.quantity", is(2)));

        // Retrieve cart and check details
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].plantName", is("Cart Jade Plant")))
                .andExpect(jsonPath("$.subtotal", is(200000))); // 100000 * 2
    }

    @Test
    void testAddDuplicateItemIncreasesQuantity() throws Exception {
        String token = jwtService.generateToken(customer1);

        CartItemRequest request1 = CartItemRequest.builder()
                .plantId(activePlant.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        CartItemRequest request2 = CartItemRequest.builder()
                .plantId(activePlant.getId())
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity", is(3)));

        // Verify subtotal is now updated
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].quantity", is(3)))
                .andExpect(jsonPath("$.subtotal", is(300000)));
    }

    @Test
    void testAddInactivePlantFails() throws Exception {
        String token = jwtService.generateToken(customer1);

        CartItemRequest request = CartItemRequest.builder()
                .plantId(inactivePlant.getId())
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Sản phẩm không hoạt động")));
    }

    @Test
    void testAddExceedsStockFails() throws Exception {
        String token = jwtService.generateToken(customer1);

        // Active plant stock is 5
        CartItemRequest request = CartItemRequest.builder()
                .plantId(activePlant.getId())
                .quantity(6)
                .build();

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("vượt quá tồn kho khả dụng")));
    }

    @Test
    void testUpdateQuantitySuccess() throws Exception {
        String token = jwtService.generateToken(customer1);

        CartItem cartItem = cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        CartItemUpdateRequest updateRequest = CartItemUpdateRequest.builder()
                .quantity(4)
                .build();

        mockMvc.perform(put("/api/cart/items/" + cartItem.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity", is(4)));
    }

    @Test
    void testUpdateQuantityExceedsStockFails() throws Exception {
        String token = jwtService.generateToken(customer1);

        CartItem cartItem = cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        CartItemUpdateRequest updateRequest = CartItemUpdateRequest.builder()
                .quantity(6) // active plant stock is 5
                .build();

        mockMvc.perform(put("/api/cart/items/" + cartItem.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("vượt quá tồn kho khả dụng")));
    }

    @Test
    void testUpdateQuantityInvalidValueFails() throws Exception {
        String token = jwtService.generateToken(customer1);

        CartItem cartItem = cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        CartItemUpdateRequest updateRequest = CartItemUpdateRequest.builder()
                .quantity(0)
                .build();

        mockMvc.perform(put("/api/cart/items/" + cartItem.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testDeleteCartItemSuccess() throws Exception {
        String token = jwtService.generateToken(customer1);

        CartItem cartItem = cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        mockMvc.perform(delete("/api/cart/items/" + cartItem.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertFalse(cartItemRepository.existsById(cartItem.getId()));
    }

    @Test
    void testOwnershipProtectionOnUpdateAndRemove() throws Exception {
        String token2 = jwtService.generateToken(customer2);

        CartItem cartItemOfCustomer1 = cartItemRepository.save(CartItem.builder()
                .customer(customer1)
                .plant(activePlant)
                .quantity(2)
                .addedAt(LocalDateTime.now())
                .build());

        // Customer 2 tries to update Customer 1's cart item
        CartItemUpdateRequest updateRequest = CartItemUpdateRequest.builder()
                .quantity(3)
                .build();

        mockMvc.perform(put("/api/cart/items/" + cartItemOfCustomer1.getId())
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());

        // Customer 2 tries to delete Customer 1's cart item
        mockMvc.perform(delete("/api/cart/items/" + cartItemOfCustomer1.getId())
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        // No authorization header
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized());

        CartItemRequest request = CartItemRequest.builder()
                .plantId(activePlant.getId())
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
