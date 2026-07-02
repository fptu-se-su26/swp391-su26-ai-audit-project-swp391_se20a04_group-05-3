package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.*;
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
import org.springframework.test.web.servlet.MvcResult;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class BookingIntegrationTest {

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
    private PlantCareServiceRepository serviceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private final String customerEmailA = "bk_customer_a@gmail.com";
    private final String customerEmailB = "bk_customer_b@gmail.com";
    private final String ownerEmailA = "bk_owner_a@gmail.com";
    private final String ownerEmailB = "bk_owner_b@gmail.com";

    private Role customerRole;
    private Role storeRole;

    private User customerA;
    private User storeOwnerA;
    private User storeOwnerB;

    private Store storeA;

    private PlantCareService serviceA;

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
        createUser(customerEmailB, customerRole);
        storeOwnerA = createUser(ownerEmailA, storeRole);
        storeOwnerB = createUser(ownerEmailB, storeRole);

        storeA = storeRepository.save(Store.builder()
                .owner(storeOwnerA)
                .name("Booking Test Store A")
                .address("Store A Address")
                .status(StoreStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .build());

        storeRepository.save(Store.builder()
                .owner(storeOwnerB)
                .name("Booking Test Store B")
                .address("Store B Address")
                .status(StoreStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .build());

        serviceA = serviceRepository.save(PlantCareService.builder()
                .store(storeA)
                .name("Standard Watering Service")
                .description("Basic plant watering")
                .price(new BigDecimal("100000"))
                .durationMinutes(30)
                .status(ServiceStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        jdbcTemplate.execute("DELETE FROM bookings");
        jdbcTemplate.execute("DELETE FROM services");
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute("DELETE FROM customer_addresses WHERE customer_id IN (SELECT id FROM users WHERE email IN ('" + customerEmailA + "', '" + customerEmailB + "'))");
        jdbcTemplate.execute("DELETE FROM cart_items WHERE customer_id IN (SELECT id FROM users WHERE email IN ('" + customerEmailA + "', '" + customerEmailB + "'))");
        jdbcTemplate.execute("DELETE FROM store_approval_audits WHERE store_id IN (SELECT id FROM stores WHERE owner_id IN (SELECT id FROM users WHERE email IN ('" + ownerEmailA + "', '" + ownerEmailB + "')))");
        jdbcTemplate.execute("DELETE FROM plants WHERE store_id IN (SELECT id FROM stores WHERE owner_id IN (SELECT id FROM users WHERE email IN ('" + ownerEmailA + "', '" + ownerEmailB + "')))");
        jdbcTemplate.execute("DELETE FROM stores WHERE owner_id IN (SELECT id FROM users WHERE email IN ('" + ownerEmailA + "', '" + ownerEmailB + "'))");
        jdbcTemplate.execute("DELETE FROM users WHERE email IN ('" + customerEmailA + "', '" + customerEmailB + "', '" + ownerEmailA + "', '" + ownerEmailB + "')");
    }

    private User createUser(String email, Role role) {
        return userRepository.save(User.builder()
                .fullName("Booking Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(role)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
    }

    @Test
    void testServiceCrudSuccess() throws Exception {
        String token = jwtService.generateToken(storeOwnerA);

        PlantCareServiceRequest request = PlantCareServiceRequest.builder()
                .storeId(storeA.getId())
                .name("Repotting Service")
                .description("Professional plant repotting")
                .price(new BigDecimal("150000"))
                .durationMinutes(45)
                .build();

        mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Repotting Service")))
                .andExpect(jsonPath("$.price", is(150000)))
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    void testServiceValidationFail() throws Exception {
        String token = jwtService.generateToken(storeOwnerA);

        PlantCareServiceRequest request = PlantCareServiceRequest.builder()
                .storeId(storeA.getId())
                .name("") // Blank name
                .price(new BigDecimal("-10")) // Negative price
                .durationMinutes(0) // Invalid duration
                .build();

        mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testServiceDeactivationSuccess() throws Exception {
        String token = jwtService.generateToken(storeOwnerA);

        mockMvc.perform(put("/api/services/" + serviceA.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("INACTIVE")));
    }

    @Test
    void testServiceOwnershipValidation() throws Exception {
        String tokenB = jwtService.generateToken(storeOwnerB);

        PlantCareServiceRequest request = PlantCareServiceRequest.builder()
                .storeId(storeA.getId())
                .name("Hacked Service")
                .price(new BigDecimal("200000"))
                .build();

        // Owner B tries to update Store A's service
        mockMvc.perform(put("/api/services/" + serviceA.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        // Owner B tries to deactivate Store A's service
        mockMvc.perform(put("/api/services/" + serviceA.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    void testBookingCreationSuccess() throws Exception {
        String token = jwtService.generateToken(customerA);

        BookingRequest request = BookingRequest.builder()
                .serviceId(serviceA.getId())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .customerNote("Watering orchid")
                .build();

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.serviceNameSnapshot", is("Standard Watering Service")))
                .andExpect(jsonPath("$.servicePriceSnapshot", is(100000)))
                .andExpect(jsonPath("$.storeNameSnapshot", is("Booking Test Store A")))
                .andExpect(jsonPath("$.status", is("PENDING")));

        // Verify notification sent to store owner
        List<Notification> notifications = notificationRepository.findAll();
        assertFalse(notifications.isEmpty());
        Notification notification = notifications.get(0);
        assertEquals(storeOwnerA.getId(), notification.getUser().getId());
        assertEquals(NotificationType.BOOKING_CREATED, notification.getType());
    }

    @Test
    void testCustomerActiveValidation() throws Exception {
        customerA.setStatus(UserStatus.LOCKED);
        userRepository.save(customerA);

        String token = jwtService.generateToken(customerA);

        BookingRequest request = BookingRequest.builder()
                .serviceId(serviceA.getId())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .build();

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testActiveBookingCap() throws Exception {
        String token = jwtService.generateToken(customerA);

        // Prepopulate 5 active bookings
        for (int i = 0; i < 5; i++) {
            bookingRepository.save(Booking.builder()
                    .customer(customerA)
                    .store(storeA)
                    .service(serviceA)
                    .serviceNameSnapshot(serviceA.getName())
                    .servicePriceSnapshot(serviceA.getPrice())
                    .storeNameSnapshot(storeA.getName())
                    .scheduledAt(LocalDateTime.now().plusHours(3 + i))
                    .serviceAddress("123 Green Rd")
                    .status(BookingStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        BookingRequest request = BookingRequest.builder()
                .serviceId(serviceA.getId())
                .scheduledAt(LocalDateTime.now().plusHours(10))
                .serviceAddress("123 Green Rd")
                .build();

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Bạn không thể có nhiều hơn 5 lịch hẹn đang hoạt động")));
    }

    @Test
    void testFutureSchedulingValidation() throws Exception {
        String token = jwtService.generateToken(customerA);

        BookingRequest request = BookingRequest.builder()
                .serviceId(serviceA.getId())
                .scheduledAt(LocalDateTime.now().plusMinutes(30)) // Less than 2 hours in the future
                .serviceAddress("123 Green Rd")
                .build();

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testStatusTransitionsAndTimestamps() throws Exception {
        String ownerToken = jwtService.generateToken(storeOwnerA);

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customerA)
                .store(storeA)
                .service(serviceA)
                .serviceNameSnapshot(serviceA.getName())
                .servicePriceSnapshot(serviceA.getPrice())
                .storeNameSnapshot(storeA.getName())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        // PENDING -> CONFIRMED
        BookingStatusUpdateRequest confirmReq = BookingStatusUpdateRequest.builder()
                .status(BookingStatus.CONFIRMED)
                .build();

        mockMvc.perform(put("/api/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.confirmedAt", notNullValue()));

        // CONFIRMED -> IN_PROGRESS
        BookingStatusUpdateRequest progressReq = BookingStatusUpdateRequest.builder()
                .status(BookingStatus.IN_PROGRESS)
                .build();

        mockMvc.perform(put("/api/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(progressReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.startedAt", notNullValue()));

        // IN_PROGRESS -> COMPLETED
        BookingStatusUpdateRequest completeReq = BookingStatusUpdateRequest.builder()
                .status(BookingStatus.COMPLETED)
                .build();

        mockMvc.perform(put("/api/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.completedAt", notNullValue()));
    }

    @Test
    void testCancellationRules() throws Exception {
        String customerToken = jwtService.generateToken(customerA);

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customerA)
                .store(storeA)
                .service(serviceA)
                .serviceNameSnapshot(serviceA.getName())
                .servicePriceSnapshot(serviceA.getPrice())
                .storeNameSnapshot(storeA.getName())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        BookingCancelRequest cancelRequest = BookingCancelRequest.builder()
                .cancelReason("Change of plans")
                .build();

        mockMvc.perform(put("/api/bookings/" + booking.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.cancelReason", is("Change of plans")))
                .andExpect(jsonPath("$.cancelledAt", notNullValue()));
    }

    @Test
    void testStoreIsolation() throws Exception {
        String ownerTokenB = jwtService.generateToken(storeOwnerB);

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customerA)
                .store(storeA) // Store A
                .service(serviceA)
                .serviceNameSnapshot(serviceA.getName())
                .servicePriceSnapshot(serviceA.getPrice())
                .storeNameSnapshot(storeA.getName())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        BookingStatusUpdateRequest request = BookingStatusUpdateRequest.builder()
                .status(BookingStatus.CONFIRMED)
                .build();

        // Owner of Store B tries to confirm booking of Store A
        mockMvc.perform(put("/api/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + ownerTokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStoreApprovedValidation() throws Exception {
        String ownerToken = jwtService.generateToken(storeOwnerA);

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customerA)
                .store(storeA)
                .service(serviceA)
                .serviceNameSnapshot(serviceA.getName())
                .servicePriceSnapshot(serviceA.getPrice())
                .storeNameSnapshot(storeA.getName())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        // Store is suspended/not approved
        storeA.setStatus(StoreStatus.PENDING);
        storeRepository.save(storeA);

        BookingStatusUpdateRequest request = BookingStatusUpdateRequest.builder()
                .status(BookingStatus.CONFIRMED)
                .build();

        mockMvc.perform(put("/api/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testPaginationAndSorting() throws Exception {
        // Verify limit protection: size=150 is capped to 100
        mockMvc.perform(get("/api/services?size=150"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(100)));
    }

    @Test
    void testSnapshotIntegrity() throws Exception {
        String token = jwtService.generateToken(customerA);

        Booking booking = bookingRepository.save(Booking.builder()
                .customer(customerA)
                .store(storeA)
                .service(serviceA)
                .serviceNameSnapshot(serviceA.getName())
                .servicePriceSnapshot(serviceA.getPrice())
                .storeNameSnapshot(storeA.getName())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        // Modify original service price, name and store name
        serviceA.setPrice(new BigDecimal("500000"));
        serviceA.setName("Premium Heavy Watering Service");
        serviceRepository.save(serviceA);

        storeA.setName("Completely Changed Store Name");
        storeRepository.save(storeA);

        // Fetch booking and verify snapshots remain unchanged
        mockMvc.perform(get("/api/bookings/" + booking.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicePriceSnapshot", is(100000)))
                .andExpect(jsonPath("$.serviceNameSnapshot", is("Standard Watering Service")))
                .andExpect(jsonPath("$.storeNameSnapshot", is("Booking Test Store A")));
    }

    @Test
    void testOptimisticLockingConcurrency() throws Exception {
        String ownerToken = jwtService.generateToken(storeOwnerA);

        final Booking booking = bookingRepository.save(Booking.builder()
                .customer(customerA)
                .store(storeA)
                .service(serviceA)
                .serviceNameSnapshot(serviceA.getName())
                .servicePriceSnapshot(serviceA.getPrice())
                .storeNameSnapshot(storeA.getName())
                .scheduledAt(LocalDateTime.now().plusHours(3))
                .serviceAddress("123 Green Rd")
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        ExecutorService executor = Executors.newFixedThreadPool(2);
        List<Callable<MvcResult>> tasks = new ArrayList<>();

        BookingStatusUpdateRequest request = BookingStatusUpdateRequest.builder()
                .status(BookingStatus.CONFIRMED)
                .build();

        for (int i = 0; i < 2; i++) {
            tasks.add(() -> mockMvc.perform(put("/api/bookings/" + booking.getId() + "/status")
                            .header("Authorization", "Bearer " + ownerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andReturn());
        }

        List<Future<MvcResult>> results = executor.invokeAll(tasks);
        executor.shutdown();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));

        int okCount = 0;
        int conflictCount = 0;

        for (Future<MvcResult> f : results) {
            int status = f.get().getResponse().getStatus();
            if (status == 200) {
                okCount++;
            } else if (status == 409) {
                conflictCount++;
            }
        }

        // Assert that exactly one concurrent update succeeded and one failed with 409 Conflict
        assertEquals(1, okCount);
        assertEquals(1, conflictCount);
    }
}
