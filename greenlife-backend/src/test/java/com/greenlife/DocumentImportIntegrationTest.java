package com.greenlife;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.blog.dto.ImportDocumentResponse;
import com.greenlife.blog.service.DocumentImportService;
import com.greenlife.security.JwtService;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import com.greenlife.user.repository.RoleRepository;
import com.greenlife.user.repository.UserRepository;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class DocumentImportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DocumentImportService documentImportService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    private User customer;
    private String tokenCustomer;

    private static final String CUSTOMER_EMAIL = "customer_import_test@gmail.com";

    @BeforeEach
    void setUp() {
        cleanup();

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("CUSTOMER").description("Customer").build()));

        customer = userRepository.save(User.builder()
                .fullName("Customer User")
                .email(CUSTOMER_EMAIL)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        tokenCustomer = jwtService.generateToken(customer);
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        userRepository.findByEmail(CUSTOMER_EMAIL).ifPresent(userRepository::delete);
    }

    // --- PARSER TESTS ---

    @Test
    void testParseTxtDocument() {
        String rawTxt = "Tiêu đề bài viết\n\nĐây là đoạn văn thứ nhất.\nĐoạn văn này có chứa ký tự tiếng Việt có dấu.\n\nĐây là đoạn văn thứ hai.";
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", rawTxt.getBytes(StandardCharsets.UTF_8));

        ImportDocumentResponse response = documentImportService.importDocument(file);
        assertEquals("Tiêu đề bài viết", response.getSuggestedTitle());
        assertEquals("TXT", response.getSourceType());
        assertEquals("test.txt", response.getSourceFileName());
        assertTrue(response.getContentHtml().contains("<p>Tiêu đề bài viết</p>"));
        assertTrue(response.getContentHtml().contains("<p>Đây là đoạn văn thứ nhất.<br>"));
        assertTrue(response.getContentHtml().contains("Đoạn văn này có chứa ký tự tiếng Việt có dấu.</p>"));
        assertTrue(response.getContentHtml().contains("<p>Đây là đoạn văn thứ hai.</p>"));
    }

    @Test
    void testParseTxtWithHtmlInjectionEscaped() {
        String rawTxt = "Tiêu đề\n\n<script>alert('hack')</script><b>Đậm</b>";
        MockMultipartFile file = new MockMultipartFile("file", "hack.txt", "text/plain", rawTxt.getBytes(StandardCharsets.UTF_8));

        ImportDocumentResponse response = documentImportService.importDocument(file);
        assertFalse(response.getContentHtml().contains("<script>"));
        assertFalse(response.getContentHtml().contains("<b>"));
        assertTrue(response.getContentHtml().contains("Đậm"));
    }

    @Test
    void testParseMarkdownDocument() {
        String markdown = "# Tiêu đề Markdown\n\nĐây là **chữ đậm** và đây là *chữ nghiêng*.\n\n* Mục 1\n* Mục 2\n\n[Link](http://example.com)";
        MockMultipartFile file = new MockMultipartFile("file", "test.md", "text/markdown", markdown.getBytes(StandardCharsets.UTF_8));

        ImportDocumentResponse response = documentImportService.importDocument(file);
        assertEquals("Tiêu đề Markdown", response.getSuggestedTitle());
        assertEquals("MD", response.getSourceType());
        assertTrue(response.getContentHtml().contains("<h1>Tiêu đề Markdown</h1>"));
        assertTrue(response.getContentHtml().contains("<strong>chữ đậm</strong>"));
        assertTrue(response.getContentHtml().contains("<em>chữ nghiêng</em>"));
        assertTrue(response.getContentHtml().contains("<ul>"));
        assertTrue(response.getContentHtml().contains("<li>Mục 1</li>"));
        assertTrue(response.getContentHtml().contains("href=\"http://example.com\""));
    }

    @Test
    void testParseMarkdownWithDangerousHtml() {
        String markdown = "# Markdown Hack\n\n<iframe src='http://evil.com'></iframe><script>alert(1)</script>Safe Text";
        MockMultipartFile file = new MockMultipartFile("file", "test_danger.md", "text/markdown", markdown.getBytes(StandardCharsets.UTF_8));

        ImportDocumentResponse response = documentImportService.importDocument(file);
        assertFalse(response.getContentHtml().contains("<iframe"));
        assertFalse(response.getContentHtml().contains("<script"));
        assertTrue(response.getContentHtml().contains("Safe Text"));
    }

    @Test
    void testParseDocxDocument() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFParagraph p1 = doc.createParagraph();
            p1.setStyle("Heading1");
            XWPFRun r1 = p1.createRun();
            r1.setText("Tiêu đề DOCX");

            XWPFParagraph p2 = doc.createParagraph();
            XWPFRun r2 = p2.createRun();
            r2.setBold(true);
            r2.setText("Đoạn văn đậm");
            XWPFRun r3 = p2.createRun();
            r3.setItalic(true);
            r3.setText(" và nghiêng.");

            doc.write(baos);
        }

        MockMultipartFile file = new MockMultipartFile("file", "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", baos.toByteArray());

        ImportDocumentResponse response = documentImportService.importDocument(file);
        assertEquals("Tiêu đề DOCX", response.getSuggestedTitle());
        assertEquals("DOCX", response.getSourceType());
        assertTrue(response.getContentHtml().contains("<h1>Tiêu đề DOCX</h1>"));
        assertTrue(response.getContentHtml().contains("<strong>Đoạn văn đậm</strong>"));
        assertTrue(response.getContentHtml().contains("<em> và nghiêng.</em>"));
    }

    // --- VALIDATION TESTS ---

    @Test
    void testImportEmptyFileRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> documentImportService.importDocument(file));
    }

    @Test
    void testImportUnsupportedExtensionRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "image.png", "image/png", "fake image content".getBytes());
        assertThrows(IllegalArgumentException.class, () -> documentImportService.importDocument(file));
    }

    @Test
    void testImportOversizedFileRejected() {
        byte[] largeBytes = new byte[5 * 1024 * 1024 + 1]; // 5MB + 1 byte
        MockMultipartFile file = new MockMultipartFile("file", "large.txt", "text/plain", largeBytes);
        assertThrows(IllegalArgumentException.class, () -> documentImportService.importDocument(file));
    }

    @Test
    void testImportPdfRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "%PDF-1.4".getBytes());
        assertThrows(IllegalArgumentException.class, () -> documentImportService.importDocument(file));
    }

    // --- SANITIZER TESTS ---

    @Test
    void testSanitizerRemovesMaliciousContent() {
        String rawHtml = "<div>" +
                "<script>alert('malicious')</script>" +
                "<p>Hello world <a href='javascript:alert(1)'>Click here</a></p>" +
                "<img src='x' onerror='alert(2)' />" +
                "<iframe src='http://evil.com'></iframe>" +
                "<object></object>" +
                "<form action='/login'></form>" +
                "<style>body { background: red; }</style>" +
                "</div>";

        String sanitized = documentImportService.sanitizeHtml(rawHtml);

        assertFalse(sanitized.contains("<script"));
        assertFalse(sanitized.contains("javascript:"));
        assertFalse(sanitized.contains("onerror"));
        assertFalse(sanitized.contains("<iframe"));
        assertFalse(sanitized.contains("<object"));
        assertFalse(sanitized.contains("<form"));
        assertFalse(sanitized.contains("<style"));
        assertTrue(sanitized.contains("<p>Hello world <a rel=\"noopener noreferrer nofollow\" target=\"_blank\">Click here</a></p>"));
    }

    @Test
    void testSanitizerAddsSafeLinkAttributes() {
        String rawHtml = "<p>Go to <a href='https://google.com'>Google</a></p>";
        String sanitized = documentImportService.sanitizeHtml(rawHtml);

        assertTrue(sanitized.contains("target=\"_blank\""));
        assertTrue(sanitized.contains("rel=\"noopener noreferrer nofollow\""));
    }

    // --- CONTROLLER API TEST ---

    @Test
    void testImportDocumentEndpointAccess() throws Exception {
        String txtContent = "Tiêu đề\n\nNội dung bài viết";
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", txtContent.getBytes(StandardCharsets.UTF_8));

        // 1. Author (Customer) access -> 200 OK
        mockMvc.perform(multipart("/api/blogs/import-document")
                        .file(file)
                        .header("Authorization", "Bearer " + tokenCustomer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestedTitle", is("Tiêu đề")))
                .andExpect(jsonPath("$.sourceType", is("TXT")))
                .andExpect(jsonPath("$.contentHtml", containsString("<p>Tiêu đề</p>")));

        // 2. Anonymous access -> 401/403
        mockMvc.perform(multipart("/api/blogs/import-document")
                        .file(file))
                .andExpect(status().isUnauthorized());
    }
}
