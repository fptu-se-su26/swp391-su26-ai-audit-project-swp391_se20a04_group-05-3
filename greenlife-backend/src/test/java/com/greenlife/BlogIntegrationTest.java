package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.dto.BlogRequest;
import com.greenlife.entity.Blog;
import com.greenlife.entity.Role;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.BlogCategory;
import com.greenlife.entity.enums.UserStatus;
import com.greenlife.repository.BlogRepository;
import com.greenlife.repository.RoleRepository;
import com.greenlife.repository.UserRepository;
import com.greenlife.security.JwtService;
import com.greenlife.service.SecurityAuditService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class BlogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @MockitoSpyBean
    private BlogRepository blogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @MockitoSpyBean
    private SecurityAuditService securityAuditService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private User owner1;
    private User owner2;
    private User admin;
    private String tokenOwner1;
    private String tokenOwner2;
    private String tokenAdmin;

    private static final String OWNER1_EMAIL = "owner1_blog@gmail.com";
    private static final String OWNER2_EMAIL = "owner2_blog@gmail.com";
    private static final String ADMIN_EMAIL = "admin_blog@gmail.com";

    @BeforeEach
    void setUp() {
        cleanup();

        Role ownerRole = roleRepository.findByName("STORE_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("STORE_OWNER").description("Store Owner").build()));
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ADMIN").description("Admin").build()));

        owner1 = userRepository.save(User.builder()
                .fullName("Owner One")
                .email(OWNER1_EMAIL)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(ownerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        owner2 = userRepository.save(User.builder()
                .fullName("Owner Two")
                .email(OWNER2_EMAIL)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(ownerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        admin = userRepository.save(User.builder()
                .fullName("Admin User")
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(adminRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        tokenOwner1 = jwtService.generateToken(owner1);
        tokenOwner2 = jwtService.generateToken(owner2);
        tokenAdmin = jwtService.generateToken(admin);
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        if (jdbcTemplate != null) {
            jdbcTemplate.execute("DELETE FROM blogs");
        }
        userRepository.findByEmail(OWNER1_EMAIL).ifPresent(userRepository::delete);
        userRepository.findByEmail(OWNER2_EMAIL).ifPresent(userRepository::delete);
        userRepository.findByEmail(ADMIN_EMAIL).ifPresent(userRepository::delete);
    }

    @Test
    void testBlogLifecycleAndImmutability() throws Exception {
        BlogRequest req = BlogRequest.builder()
                .title("Cây Trầu Bà Xanh")
                .category(BlogCategory.BASIC_CARE)
                .summary("Hướng dẫn trồng trầu bà")
                .content("<p>Nội dung của bài viết trồng trầu bà...</p>")
                .imageUrl("http://example.com/trau-ba.jpg")
                .build();

        // 1. Create (Draft by default)
        String responseJson = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title", is("Cây Trầu Bà Xanh")))
                .andExpect(jsonPath("$.slug", is("cay-trau-ba-xanh")))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.readingTime", is(1))) // Short content -> 1 min
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(responseJson).get("id").asInt();

        // 2. Title Update (Slug remains unchanged)
        BlogRequest updateReq = BlogRequest.builder()
                .title("Cây Trầu Bà Xanh Đột Biến")
                .category(BlogCategory.BASIC_CARE)
                .summary("Tóm tắt mới")
                .content("<p>Nội dung mới...</p>")
                .imageUrl("http://example.com/trau-ba.jpg")
                .build();

        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cây Trầu Bà Xanh Đột Biến")))
                .andExpect(jsonPath("$.slug", is("cay-trau-ba-xanh"))); // Slug MUST remain unchanged

        // 3. Publish completeness validations (Lacks summary/imageUrl)
        BlogRequest incompleteReq = BlogRequest.builder()
                .title("Cây Trầu Bà Cực Đẹp")
                .category(BlogCategory.BASIC_CARE)
                .summary("") // Lacks summary
                .content("<p>Nội dung...</p>")
                .imageUrl("http://example.com/trau-ba.jpg")
                .build();

        // We update to make it incomplete first
        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(incompleteReq)))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/blogs/" + blogId + "/publish")
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Blog chưa đủ thông tin để xuất bản")));

        // Complete it again
        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // Publish successfully
        mockMvc.perform(patch("/api/blogs/" + blogId + "/publish")
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")))
                .andExpect(jsonPath("$.publishedAt").exists());
    }

    @Test
    void testSlugCollisionResolution() throws Exception {
        BlogRequest req = BlogRequest.builder()
                .title("Cách Trồng Rau Sạch")
                .category(BlogCategory.URBAN_FARMING)
                .summary("Trồng rau")
                .content("Hướng dẫn chi tiết trồng rau sạch")
                .imageUrl("http://example.com/image.jpg")
                .build();

        // First creation -> cách-trồng-rau-sạch
        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug", is("cach-trong-rau-sach")));

        // Second creation with same title -> cách-trồng-rau-sạch-2
        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug", is("cach-trong-rau-sach-2")));

        // Third creation with same title -> cách-trồng-rau-sạch-3
        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug", is("cach-trong-rau-sach-3")));
    }

    @Test
    void testSoftDeleteAndSlugLocked() throws Exception {
        BlogRequest req = BlogRequest.builder()
                .title("Cách Trồng Cà Chua")
                .category(BlogCategory.URBAN_FARMING)
                .summary("Trồng cà chua")
                .content("Hướng dẫn chi tiết trồng cà chua")
                .imageUrl("http://example.com/tomato.jpg")
                .build();

        String responseJson = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug", is("cach-trong-ca-chua")))
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(responseJson).get("id").asInt();

        // Soft delete it
        mockMvc.perform(delete("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isNoContent());

        // Check if soft deleted blogs cannot be fetched (404)
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/blogs/slug/cach-trong-ca-chua"))
                .andExpect(status().isNotFound());

        // Assert slug is NOT released (new blog gets cach-trong-ca-chua-2)
        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug", is("cach-trong-ca-chua-2")));
    }

    @Test
    void testOptimisticLockingConflicts() throws Exception {
        BlogRequest req = BlogRequest.builder()
                .title("Optimistic Locking Test")
                .category(BlogCategory.INSPIRATION)
                .summary("Test locking")
                .content("Content...")
                .imageUrl("http://example.com/img.jpg")
                .build();

        String res = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(res).get("id").asInt();

        // Force a concurrent conflict using executor
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Exception> errorRef = new AtomicReference<>();

        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        executor.submit(() -> {
            try {
                transactionTemplate.execute(status -> {
                    Blog b1 = blogRepository.findById(blogId).orElseThrow();
                    b1.setTitle("Title User A");
                    blogRepository.saveAndFlush(b1);
                    latch.countDown();
                    return null;
                });
            } catch (Exception e) {
                errorRef.set(e);
            }
        });

        try {
            transactionTemplate.execute(status -> {
                Blog b2 = blogRepository.findById(blogId).orElseThrow();
                try {
                    latch.await(); // wait for Thread A to complete and update version
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                b2.setTitle("Title User B");
                blogRepository.saveAndFlush(b2); // Should throw OptimisticLockingFailureException
                return null;
            });
        } catch (Exception e) {
            errorRef.set(e);
        }

        executor.shutdown();
        assertNotNull(errorRef.get());
        assertTrue(errorRef.get() instanceof org.springframework.transaction.UnexpectedRollbackException
                || errorRef.get() instanceof org.springframework.orm.ObjectOptimisticLockingFailureException);

        // Verify API maps conflict to 409 Conflict with standard error contract
        BlogRequest conflictUpdate = BlogRequest.builder()
                .title("Concurrent Update API")
                .category(BlogCategory.INSPIRATION)
                .summary("Test locking")
                .content("Content...")
                .imageUrl("http://example.com/img.jpg")
                .build();

        // Reset spy to clear stubs and invocations from the first part of the test
        org.mockito.Mockito.reset(blogRepository);

        // Stub findById to simulate concurrent modification *during* the update transaction
        org.mockito.Mockito.doAnswer(invocation -> {
            Integer id = invocation.getArgument(0);
            Blog b = entityManager.find(Blog.class, id);
            if (b != null) {
                jdbcTemplate.update("UPDATE blogs SET version = version + 5 WHERE id = ?", id);
            }
            return java.util.Optional.ofNullable(b);
        }).when(blogRepository).findById(blogId);

        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conflictUpdate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", containsString("Blog has been modified by another user")))
                .andExpect(jsonPath("$.path", is("/api/blogs/" + blogId)))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void testAuditFailureIsolation() throws Exception {
        // Stub the spy to throw an exception when recordSecurityAudit is called
        doThrow(new RuntimeException("Audit Database Down"))
                .when(securityAuditService).recordSecurityAudit(any(), any(), any());

        BlogRequest req = BlogRequest.builder()
                .title("Audit Failure Test")
                .category(BlogCategory.INSPIRATION)
                .summary("Test audit isolation")
                .content("Content...")
                .imageUrl("http://example.com/img.jpg")
                .build();

        // Create blog should STILL succeed even if audit logging fails
        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void testVisibilityAnd404InformationDisclosure() throws Exception {
        BlogRequest req = BlogRequest.builder()
                .title("Draft Blog Post")
                .category(BlogCategory.BASIC_CARE)
                .summary("Draft summary")
                .content("Draft content...")
                .imageUrl("http://example.com/img.jpg")
                .build();

        String res = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(res).get("id").asInt();

        // Anonymous lookup by ID on draft blog -> 404 (NOT 403)
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Blog không tồn tại")));

        // Unauthorized Store Owner lookup on draft blog -> 404
        mockMvc.perform(get("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner2))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Blog không tồn tại")));

        // Author lookup -> 200 OK
        mockMvc.perform(get("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(blogId)));

        // Admin lookup -> 200 OK
        mockMvc.perform(get("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(blogId)));
    }

    @Test
    void testCategoriesEndpoint() throws Exception {
        mockMvc.perform(get("/api/blogs/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$", containsInAnyOrder("BASIC_CARE", "DISEASE", "INSPIRATION", "URBAN_FARMING", "GREEN_LIVING")));
    }

    @Test
    void testReadingTimeCalculation() throws Exception {
        // Build large content string
        StringBuilder contentSb = new StringBuilder();
        for (int i = 0; i < 350; i++) {
            contentSb.append("<p>word").append(i).append("</p> ");
        }

        BlogRequest req = BlogRequest.builder()
                .title("Reading Time Test")
                .category(BlogCategory.BASIC_CARE)
                .summary("Reading time test")
                .content(contentSb.toString())
                .imageUrl("http://example.com/img.jpg")
                .build();

        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.readingTime", is(2))); // ceil(350/200) = 2
    }

    @Test
    void testGetMyBlogsFiltered() throws Exception {
        BlogRequest req1 = BlogRequest.builder()
                .title("My Urban Farm Blog")
                .category(BlogCategory.URBAN_FARMING)
                .summary("summary")
                .content("content...")
                .imageUrl("http://example.com/img.jpg")
                .build();

        BlogRequest req2 = BlogRequest.builder()
                .title("My Basic Care Guide")
                .category(BlogCategory.BASIC_CARE)
                .summary("summary")
                .content("content...")
                .imageUrl("http://example.com/img.jpg")
                .build();

        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());

        // Perform lookups on `/api/blogs/my`
        mockMvc.perform(get("/api/blogs/my")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .param("category", "URBAN_FARMING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title", is("My Urban Farm Blog")));
    }
}
