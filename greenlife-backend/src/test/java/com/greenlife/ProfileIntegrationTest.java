package com.greenlife;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.user.dto.UserProfileRequest;

import com.greenlife.user.entity.User;
import com.greenlife.user.entity.Role;

import com.greenlife.user.entity.enums.UserStatus;

import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.repository.RoleRepository;

import com.greenlife.security.JwtService;
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
import org.springframework.test.web.servlet.MvcResult;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final String customerEmail = "profile_cust@gmail.com";
    private Role customerRole;
    private User customer;
    private String customerToken;

    @BeforeEach
    void setUp() {
        customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("CUSTOMER")
                        .description("Customer Role")
                        .build()));

        cleanupDatabase();

        customer = userRepository.save(User.builder()
                .fullName("Old Full Name")
                .email(customerEmail)
                .phone("0987654321")
                .address("Old Address")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .build());

        customerToken = "Bearer " + jwtService.generateToken(customer);
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
        deleteDirectory(new File("./uploads"));
    }

    private void cleanupDatabase() {
        userRepository.findByEmail(customerEmail).ifPresent(userRepository::delete);
    }

    private byte[] createValidImageBytes() throws IOException {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    private void deleteDirectory(File dir) {
        if (dir.exists()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    deleteDirectory(f);
                }
            }
            dir.delete();
        }
    }

    @Test
    void testValidProfileUpdate() throws Exception {
        UserProfileRequest request = UserProfileRequest.builder()
                .fullName("New Full Name")
                .phone("0912345678")
                .address("New Address")
                .build();

        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("New Full Name")))
                .andExpect(jsonPath("$.phone", is("0912345678")))
                .andExpect(jsonPath("$.address", is("New Address")));

        // Verify in DB
        User dbUser = userRepository.findById(customer.getId()).orElseThrow();
        assertEquals("New Full Name", dbUser.getFullName());
        assertEquals("0912345678", dbUser.getPhone());
        assertEquals("New Address", dbUser.getAddress());
    }

    @Test
    void testInvalidProfileFields() throws Exception {
        // Blank Name
        UserProfileRequest requestBlankName = UserProfileRequest.builder()
                .fullName("")
                .phone("0912345678")
                .address("New Address")
                .build();

        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBlankName))
                        .header("Authorization", customerToken))
                .andExpect(status().isBadRequest());

        // Invalid phone pattern
        UserProfileRequest requestBadPhone = UserProfileRequest.builder()
                .fullName("Valid Name")
                .phone("1234567890") // Starts with 1
                .address("New Address")
                .build();

        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBadPhone))
                        .header("Authorization", customerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testProfileUpdateUnauthenticated() throws Exception {
        UserProfileRequest request = UserProfileRequest.builder()
                .fullName("New Full Name")
                .phone("0912345678")
                .address("New Address")
                .build();

        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAvatarReplacementAndCleanup() throws Exception {
        byte[] imgBytes = createValidImageBytes();

        // 1. Upload first avatar
        MockMultipartFile file1 = new MockMultipartFile("file", "avatar1.png", "image/png", imgBytes);
        MvcResult result1 = mockMvc.perform(multipart("/api/users/profile/avatar")
                        .file(file1)
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl", startsWith("/uploads/avatars/")))
                .andReturn();

        Map<String, String> response1 = objectMapper.readValue(result1.getResponse().getContentAsString(), new TypeReference<Map<String, String>>() {});
        String avatar1Url = response1.get("avatarUrl");
        String relativeUrl1 = avatar1Url.substring("/uploads/avatars/".length());
        File diskFile1 = new File("./uploads/avatars/" + relativeUrl1);
        assertTrue(diskFile1.exists(), "Avatar 1 file should exist on disk");

        // Verify DB updated
        User dbUser1 = userRepository.findById(customer.getId()).orElseThrow();
        assertEquals(avatar1Url, dbUser1.getAvatarUrl());

        // 2. Upload second avatar to replace it
        MockMultipartFile file2 = new MockMultipartFile("file", "avatar2.png", "image/png", imgBytes);
        MvcResult result2 = mockMvc.perform(multipart("/api/users/profile/avatar")
                        .file(file2)
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl", startsWith("/uploads/avatars/")))
                .andReturn();

        Map<String, String> response2 = objectMapper.readValue(result2.getResponse().getContentAsString(), new TypeReference<Map<String, String>>() {});
        String avatar2Url = response2.get("avatarUrl");
        String relativeUrl2 = avatar2Url.substring("/uploads/avatars/".length());
        File diskFile2 = new File("./uploads/avatars/" + relativeUrl2);

        // Verify Avatar 2 file is on disk
        assertTrue(diskFile2.exists(), "Avatar 2 file should exist on disk");

        // Verify Avatar 1 file is deleted from disk
        assertFalse(diskFile1.exists(), "Avatar 1 file should have been deleted from disk");

        // Verify DB updated
        User dbUser2 = userRepository.findById(customer.getId()).orElseThrow();
        assertEquals(avatar2Url, dbUser2.getAvatarUrl());
    }

    @Test
    void testAvatarRollbackOnUploadFailure() throws Exception {
        // Upload with invalid file content to trigger IllegalArgumentException in ImageIO read
        byte[] invalidBytes = "This is not an image".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "bad.png", "image/png", invalidBytes);

        mockMvc.perform(multipart("/api/users/profile/avatar")
                        .file(file)
                        .header("Authorization", customerToken))
                .andExpect(status().isBadRequest());

        // Assert that no file exists in ./uploads/avatars
        File uploadFolder = new File("./uploads/avatars");
        if (uploadFolder.exists()) {
            File[] files = uploadFolder.listFiles();
            if (files != null) {
                assertEquals(0, files.length, "File should have been cleaned up");
            }
        }
    }
}
