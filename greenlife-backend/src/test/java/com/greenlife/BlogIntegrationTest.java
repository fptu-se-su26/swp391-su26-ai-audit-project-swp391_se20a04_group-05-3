package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.blog.dto.BlogRequest;
import com.greenlife.blog.dto.UpdateBlogDraftRequest;
import com.greenlife.blog.dto.SubmitBlogRequest;
import com.greenlife.blog.dto.ModerationDecisionRequest;
import com.greenlife.blog.entity.Blog;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.blog.repository.BlogRepository;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.security.JwtService;
import com.greenlife.auth.service.SecurityAuditService;
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
            jdbcTemplate.execute("UPDATE blogs SET published_revision_id = NULL, current_revision_id = NULL");
            jdbcTemplate.execute("DELETE FROM blog_moderation_history");
            jdbcTemplate.execute("DELETE FROM blog_revisions");
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
        Integer version = objectMapper.readTree(responseJson).get("version").asInt();

        // 2. Title Update (Slug remains unchanged)
        UpdateBlogDraftRequest updateReq = UpdateBlogDraftRequest.builder()
                .title("Cây Trầu Bà Xanh Đột Biến")
                .category(BlogCategory.BASIC_CARE)
                .summary("Tóm tắt mới")
                .content("<p>Nội dung mới...</p>")
                .imageUrl("http://example.com/trau-ba.jpg")
                .version(version)
                .build();

        String updateResponse = mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cây Trầu Bà Xanh Đột Biến")))
                .andExpect(jsonPath("$.slug", is("cay-trau-ba-xanh")))
                .andReturn().getResponse().getContentAsString();

        Integer updatedVersion = objectMapper.readTree(updateResponse).get("version").asInt();

        // 3. Publish completeness validations (Lacks summary/imageUrl)
        UpdateBlogDraftRequest incompleteReq = UpdateBlogDraftRequest.builder()
                .title("Cây Trầu Bà Cực Đẹp")
                .category(BlogCategory.BASIC_CARE)
                .summary("") // Lacks summary
                .content("<p>Nội dung...</p>")
                .imageUrl("http://example.com/trau-ba.jpg")
                .version(updatedVersion)
                .build();

        // We update to make it incomplete first
        String incompleteResponse = mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(incompleteReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer incompleteVersion = objectMapper.readTree(incompleteResponse).get("version").asInt();

        // Try to submit incomplete draft -> Expect 400 Bad Request
        SubmitBlogRequest submitReqIncomplete = SubmitBlogRequest.builder()
                .version(incompleteVersion)
                .build();

        mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReqIncomplete)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Bài viết chưa đủ thông tin để gửi duyệt")));

        // Complete it again
        UpdateBlogDraftRequest completeAgainReq = UpdateBlogDraftRequest.builder()
                .title("Cây Trầu Bà Xanh Đột Biến")
                .category(BlogCategory.BASIC_CARE)
                .summary("Tóm tắt mới")
                .content("<p>Nội dung mới...</p>")
                .imageUrl("http://example.com/trau-ba.jpg")
                .version(incompleteVersion)
                .build();

        String completedResponse = mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeAgainReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer completedVersion = objectMapper.readTree(completedResponse).get("version").asInt();

        // Submit successfully
        SubmitBlogRequest submitReqSuccess = SubmitBlogRequest.builder()
                .version(completedVersion)
                .build();

        String submittedResponse = mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReqSuccess)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("PENDING_REVIEW")))
                .andReturn().getResponse().getContentAsString();

        Integer submittedVersion = objectMapper.readTree(submittedResponse).get("version").asInt();

        // Admin approves and publishes
        ModerationDecisionRequest approveReq = ModerationDecisionRequest.builder()
                .note("Bản viết rất tốt")
                .version(submittedVersion)
                .build();

        mockMvc.perform(patch("/api/admin/blogs/" + blogId + "/approve")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")));
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
    void testOptimisticLockingConflictsStaleVersion() throws Exception {
        BlogRequest req = BlogRequest.builder()
                .title("Stale Version Title")
                .category(BlogCategory.INSPIRATION)
                .summary("Test locking")
                .content("<p>Initial content...</p>")
                .imageUrl("http://example.com/img.jpg")
                .build();

        String res = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        System.out.println("DEBUG CREATED RES: " + res);
        Integer blogId = objectMapper.readTree(res).get("id").asInt();
        Integer version = objectMapper.readTree(res).get("version").asInt();
        System.out.println("DEBUG CREATED VERSION: " + version);

        // Update 1: successful update using current version
        UpdateBlogDraftRequest update1 = UpdateBlogDraftRequest.builder()
                .title("Updated Title A")
                .category(BlogCategory.INSPIRATION)
                .summary("Test locking")
                .content("<p>Updated content...</p>")
                .imageUrl("http://example.com/img.jpg")
                .version(version)
                .build();

        String res1 = mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Title A")))
                .andReturn().getResponse().getContentAsString();

        System.out.println("DEBUG UPDATE1 RES: " + res1);
        Integer newVersion = objectMapper.readTree(res1).get("version").asInt();
        System.out.println("DEBUG UPDATE1 VERSION: " + newVersion);

        // Update 2: update using now-stale old version -> expect 409 Conflict
        UpdateBlogDraftRequest updateStale = UpdateBlogDraftRequest.builder()
                .title("Stale Update Title")
                .category(BlogCategory.INSPIRATION)
                .summary("Test locking")
                .content("<p>Stale content...</p>")
                .imageUrl("http://example.com/img.jpg")
                .version(version) // Using the old stale version
                .build();

        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateStale)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", containsString("Dữ liệu bài viết đã được thay đổi")));

        String resGet = mockMvc.perform(get("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Title A")))
                .andReturn().getResponse().getContentAsString();
        System.out.println("DEBUG GET RES: " + resGet);
        Integer finalGetVersion = objectMapper.readTree(resGet).get("version").asInt();
        System.out.println("DEBUG GET VERSION: " + finalGetVersion);

        mockMvc.perform(get("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Title A")))
                .andExpect(jsonPath("$.version", is(newVersion)));
    }

    @Test
    void testOptimisticLockingConflictsExceptionMapping() throws Exception {
        BlogRequest req = BlogRequest.builder()
                .title("Exception Mapping Title")
                .category(BlogCategory.INSPIRATION)
                .summary("Test locking")
                .content("<p>Content...</p>")
                .imageUrl("http://example.com/img.jpg")
                .build();

        String res = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(res).get("id").asInt();
        Integer version = objectMapper.readTree(res).get("version").asInt();

        UpdateBlogDraftRequest conflictUpdate = UpdateBlogDraftRequest.builder()
                .title("Concurrent Update API")
                .category(BlogCategory.INSPIRATION)
                .summary("Test locking")
                .content("<p>Content...</p>")
                .imageUrl("http://example.com/img.jpg")
                .version(version)
                .build();

        // Reset spy to clear stubs and invocations
        org.mockito.Mockito.reset(blogRepository);

        // Stub blogRepository.saveAndFlush to throw ObjectOptimisticLockingFailureException,
        // simulating a concurrent modification detected at the persistence boundary.
        // This avoids any competing database transaction or direct jdbcTemplate UPDATE.
        org.mockito.Mockito.doThrow(
                new org.springframework.orm.ObjectOptimisticLockingFailureException("Blog", null)
        ).when(blogRepository).saveAndFlush(org.mockito.ArgumentMatchers.any());

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

    @Test
    void testModerationWorkflowLifecycle() throws Exception {
        // 1. Create Draft
        BlogRequest req = BlogRequest.builder()
                .title("Hướng Dẫn Chăm Hoa Hồng")
                .category(BlogCategory.BASIC_CARE)
                .summary("Cách chăm hoa hồng ra nhiều hoa")
                .content("<p>Nội dung chi tiết...</p>")
                .imageUrl("http://example.com/hoa-hong.jpg")
                .build();

        String responseJson = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(responseJson).get("id").asInt();
        Integer version = objectMapper.readTree(responseJson).get("version").asInt();

        // 2. Submit to PENDING_REVIEW
        SubmitBlogRequest submitReq = SubmitBlogRequest.builder().version(version).build();
        String submitJson = mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("PENDING_REVIEW")))
                .andReturn().getResponse().getContentAsString();

        Integer pendingVersion = objectMapper.readTree(submitJson).get("version").asInt();

        // 3. Author cannot edit PENDING_REVIEW -> expect 400 Bad Request
        UpdateBlogDraftRequest editReq = UpdateBlogDraftRequest.builder()
                .title("Chăm Hoa Hồng Sâu Bệnh")
                .category(BlogCategory.BASIC_CARE)
                .summary("Cách chăm hoa hồng ra nhiều hoa")
                .content("<p>Nội dung chi tiết...</p>")
                .imageUrl("http://example.com/hoa-hong.jpg")
                .version(pendingVersion)
                .build();

        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editReq)))
                .andExpect(status().isBadRequest());

        // 4. Author withdraws PENDING_REVIEW -> DRAFT
        SubmitBlogRequest withdrawReq = SubmitBlogRequest.builder().version(pendingVersion).build();
        String withdrawJson = mockMvc.perform(post("/api/blogs/" + blogId + "/withdraw")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(withdrawReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("DRAFT")))
                .andReturn().getResponse().getContentAsString();

        Integer draftVersion = objectMapper.readTree(withdrawJson).get("version").asInt();

        // 5. Submit again
        submitReq = SubmitBlogRequest.builder().version(draftVersion).build();
        String resubmitJson = mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("PENDING_REVIEW")))
                .andReturn().getResponse().getContentAsString();

        Integer resubmitVersion = objectMapper.readTree(resubmitJson).get("version").asInt();
        System.out.println("DEBUG RESUBMIT JSON: " + resubmitJson);
        System.out.println("DEBUG RESUBMIT VERSION: " + resubmitVersion);

        // 6. Admin requests changes with reason
        ModerationDecisionRequest changesReq = ModerationDecisionRequest.builder()
                .note("Vui lòng ghi rõ lượng nước tưới hàng ngày.")
                .version(resubmitVersion)
                .build();

        String changesJson = mockMvc.perform(patch("/api/admin/blogs/" + blogId + "/request-changes")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changesReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("CHANGES_REQUESTED")))
                .andExpect(jsonPath("$.reviewerNote", is("Vui lòng ghi rõ lượng nước tưới hàng ngày.")))
                .andReturn().getResponse().getContentAsString();

        Integer changesVersion = objectMapper.readTree(changesJson).get("version").asInt();

        // 7. CHANGES_REQUESTED -> DRAFT when author resumes editing (updates content)
        UpdateBlogDraftRequest resumeEditReq = UpdateBlogDraftRequest.builder()
                .title("Hướng Dẫn Chăm Hoa Hồng Đỏ")
                .category(BlogCategory.BASIC_CARE)
                .summary("Cách chăm hoa hồng ra nhiều hoa")
                .content("<p>Tưới nước 2 lần/ngày...</p>")
                .imageUrl("http://example.com/hoa-hong.jpg")
                .version(changesVersion)
                .build();

        String resumedJson = mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resumeEditReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("DRAFT")))
                .andReturn().getResponse().getContentAsString();

        Integer resumedVersion = objectMapper.readTree(resumedJson).get("version").asInt();

        // 8. Resubmit
        submitReq = SubmitBlogRequest.builder().version(resumedVersion).build();
        String finalPendingJson = mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer finalPendingVersion = objectMapper.readTree(finalPendingJson).get("version").asInt();

        // 9. Admin rejects with reason
        ModerationDecisionRequest rejectReq = ModerationDecisionRequest.builder()
                .note("Nội dung không đạt yêu cầu cộng đồng.")
                .version(finalPendingVersion)
                .build();

        String rejectedJson = mockMvc.perform(patch("/api/admin/blogs/" + blogId + "/reject")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("REJECTED")))
                .andReturn().getResponse().getContentAsString();

        Integer rejectedVersion = objectMapper.readTree(rejectedJson).get("version").asInt();

        // 10. Rejected revision remains immutable -> editing directly throws 400 Bad Request
        UpdateBlogDraftRequest editRejectedReq = UpdateBlogDraftRequest.builder()
                .title("Cố ý chỉnh sửa bài bị từ chối")
                .category(BlogCategory.BASIC_CARE)
                .summary("Summary")
                .content("Content...")
                .imageUrl("http://example.com/img.jpg")
                .version(rejectedVersion)
                .build();

        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editRejectedReq)))
                .andExpect(status().isBadRequest());

        // 11. Create a new draft revision from rejected content
        String newDraftFromRejectedJson = mockMvc.perform(post("/api/blogs/" + blogId + "/revisions")
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentRevisionStatus", is("DRAFT")))
                .andExpect(jsonPath("$.version").exists())
                .andReturn().getResponse().getContentAsString();

        Integer draftFromRejectedVersion = objectMapper.readTree(newDraftFromRejectedJson).get("version").asInt();

        // Check that it cloned the previous rejected revision properties
        mockMvc.perform(get("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", containsString("Hoa Hồng Đỏ")))
                .andExpect(jsonPath("$.currentRevisionStatus", is("DRAFT")))
                .andExpect(jsonPath("$.version", is(draftFromRejectedVersion)));
    }

    @Test
    void testPublishingRevisionAndAdminArchive() throws Exception {
        // 1. Create and submit
        BlogRequest req = BlogRequest.builder()
                .title("Cách Trồng Hành Tây")
                .category(BlogCategory.URBAN_FARMING)
                .summary("Hướng dẫn gieo hạt hành tây")
                .content("<p>Chuẩn bị đất xốp...</p>")
                .imageUrl("http://example.com/hanh-tay.jpg")
                .build();

        String responseJson = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(responseJson).get("id").asInt();
        Integer version = objectMapper.readTree(responseJson).get("version").asInt();

        SubmitBlogRequest submitReq = SubmitBlogRequest.builder().version(version).build();
        String submitJson = mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer pendingVersion = objectMapper.readTree(submitJson).get("version").asInt();

        // Verify public lookup (by ID or Slug) returns 404 since it's not approved yet
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/blogs/slug/cach-trong-hanh-tay"))
                .andExpect(status().isNotFound());

        // Verify public list does not contain it
        mockMvc.perform(get("/api/blogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // 2. Admin approves and publishes -> status is PUBLISHED
        ModerationDecisionRequest approveReq = ModerationDecisionRequest.builder()
                .note("Được chấp nhận")
                .version(pendingVersion)
                .build();

        mockMvc.perform(patch("/api/admin/blogs/" + blogId + "/approve")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")))
                .andExpect(jsonPath("$.currentRevisionStatus", is("PUBLISHED")));

        // 3. Public list/detail now shows approved content
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cách Trồng Hành Tây")))
                .andExpect(jsonPath("$.status", is("PUBLISHED")));

        mockMvc.perform(get("/api/blogs/slug/cach-trong-hanh-tay"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cách Trồng Hành Tây")));

        mockMvc.perform(get("/api/blogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title", is("Cách Trồng Hành Tây")));

        // 4. Edit a published blog: first spawn a new revision draft (PUBLISHED stays public)
        String newRevJson = mockMvc.perform(post("/api/blogs/" + blogId + "/revisions")
                        .header("Authorization", "Bearer " + tokenOwner1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED"))) // Overall blog is still published
                .andExpect(jsonPath("$.currentRevisionStatus", is("DRAFT"))) // Current draft revision status
                .andReturn().getResponse().getContentAsString();

        Integer draftVersion = objectMapper.readTree(newRevJson).get("version").asInt();

        // 5. Update the new draft revision (PUBLISHED content remains unchanged publicly)
        UpdateBlogDraftRequest editReq = UpdateBlogDraftRequest.builder()
                .title("Cách Trồng Hành Tây Khổng Lồ")
                .category(BlogCategory.URBAN_FARMING)
                .summary("Hướng dẫn gieo hạt hành tây")
                .content("<p>Chuẩn bị đất xốp + phân bón nhiều...</p>")
                .imageUrl("http://example.com/hanh-tay.jpg")
                .version(draftVersion)
                .build();

        String updatedDraftJson = mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer updatedDraftVersion = objectMapper.readTree(updatedDraftJson).get("version").asInt();

        // Verify public content is still the old title
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cách Trồng Hành Tây")));

        // 6. Submit the new draft revision
        SubmitBlogRequest submitReq2 = SubmitBlogRequest.builder().version(updatedDraftVersion).build();
        String submitJson2 = mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq2)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer pendingVersion2 = objectMapper.readTree(submitJson2).get("version").asInt();

        // Verify public content is still the old title while new revision is pending
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cách Trồng Hành Tây")));

        // 7. Admin approves new revision -> public content switches to new version
        ModerationDecisionRequest approveReq2 = ModerationDecisionRequest.builder()
                .note("Đồng ý bản sửa đổi")
                .version(pendingVersion2)
                .build();

        mockMvc.perform(patch("/api/admin/blogs/" + blogId + "/approve")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cách Trồng Hành Tây Khổng Lồ")))
                .andExpect(jsonPath("$.status", is("PUBLISHED")));

        // Verify public endpoints show updated content
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Cách Trồng Hành Tây Khổng Lồ")));

        // 8. Admin archives the published blog
        mockMvc.perform(patch("/api/admin/blogs/" + blogId + "/archive")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ARCHIVED")));

        // Archived article disappears from public endpoints (404)
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/blogs/slug/cach-trong-hanh-tay"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/blogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void testOwnershipAndAuthorizationSecurity() throws Exception {
        // 1. Owner 1 creates a draft
        BlogRequest req = BlogRequest.builder()
                .title("Bí Mật Của Rừng")
                .category(BlogCategory.GREEN_LIVING)
                .summary("Một bài viết bí mật")
                .content("<p>Nội dung bí mật...</p>")
                .imageUrl("http://example.com/secret.jpg")
                .build();

        String res = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(res).get("id").asInt();
        Integer version = objectMapper.readTree(res).get("version").asInt();

        // 2. Owner 2 tries to update Owner 1's draft -> 403 Forbidden
        UpdateBlogDraftRequest editReq = UpdateBlogDraftRequest.builder()
                .title("Hack Tiêu Đề")
                .category(BlogCategory.GREEN_LIVING)
                .summary("Một bài viết bí mật")
                .content("<p>Nội dung bí mật...</p>")
                .imageUrl("http://example.com/secret.jpg")
                .version(version)
                .build();

        mockMvc.perform(put("/api/blogs/" + blogId)
                        .header("Authorization", "Bearer " + tokenOwner2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editReq)))
                .andExpect(status().isForbidden());

        // 3. Owner 2 tries to submit Owner 1's draft -> 403 Forbidden
        SubmitBlogRequest submitReq = SubmitBlogRequest.builder().version(version).build();
        mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isForbidden());

        // 4. Anonymous user cannot view unpublished blog -> 404
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isNotFound());
    }

    @Test
    void testStaleModerationDecisionConflict() throws Exception {
        // 1. Owner 1 creates and submits a draft
        BlogRequest req = BlogRequest.builder()
                .title("Trồng Dâu Tây")
                .category(BlogCategory.URBAN_FARMING)
                .summary("Hướng dẫn gieo hạt dâu tây")
                .content("<p>Chuẩn bị đất xốp...</p>")
                .imageUrl("http://example.com/dau-tay.jpg")
                .build();

        String responseJson = mockMvc.perform(post("/api/blogs")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer blogId = objectMapper.readTree(responseJson).get("id").asInt();
        Integer version = objectMapper.readTree(responseJson).get("version").asInt();

        SubmitBlogRequest submitReq = SubmitBlogRequest.builder().version(version).build();
        String submitJson = mockMvc.perform(post("/api/blogs/" + blogId + "/submit")
                        .header("Authorization", "Bearer " + tokenOwner1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Integer pendingVersion = objectMapper.readTree(submitJson).get("version").asInt();

        // 2. Admin tries to approve with a stale (incorrect/old) version -> 409 Conflict
        ModerationDecisionRequest approveReqStale = ModerationDecisionRequest.builder()
                .note("Đồng ý duyệt")
                .version(pendingVersion - 1) // Stale version
                .build();

        mockMvc.perform(patch("/api/admin/blogs/" + blogId + "/approve")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReqStale)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", containsString("Dữ liệu bài viết đã được thay đổi")));
    }
}

