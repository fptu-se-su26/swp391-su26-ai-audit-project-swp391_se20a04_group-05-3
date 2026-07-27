package com.greenlife.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ActuatorSecurityMatcherTest
 *
 * This test verifies the security filter chain matching rules for actuator endpoints.
 * It uses a mock controller (DummyController) to match paths /actuator/health and /actuator/env,
 * verifying that the security rules are applied correctly.
 *
 * NOTE: This test validates ONLY security rule patterns.
 * ACTUAL_ACTUATOR_RUNTIME_CHECK_PENDING_DEPLOYMENT: Real Actuator health endpoint availability
 * (including system health checks, DB, and mail indicators) is deferred to runtime deployment.
 */
@WebMvcTest(ActuatorSecurityMatcherTest.DummyController.class)
@Import({SecurityConfig.class, ActuatorSecurityMatcherTest.TestConfig.class})
public class ActuatorSecurityMatcherTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private org.springframework.security.authentication.AuthenticationProvider authenticationProvider;

    @MockitoBean
    private CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @MockitoBean
    private CustomAccessDeniedHandler customAccessDeniedHandler;

    @MockitoBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @RestController
    static class DummyController {
        @GetMapping("/actuator/health")
        public String health() {
            return "{\"status\":\"UP\"}";
        }

        @GetMapping("/actuator/env")
        public String env() {
            return "env";
        }
    }

    @org.springframework.boot.test.context.TestConfiguration
    static class TestConfig {
        @org.springframework.context.annotation.Bean
        public DummyController dummyController() {
            return new DummyController();
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        // Ensure mocked JWT filter continues the filter chain
        doAnswer(invocation -> {
            jakarta.servlet.ServletRequest request = invocation.getArgument(0);
            jakarta.servlet.ServletResponse response = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());

        // Stub the mocked authentication entry point to return 401 Unauthorized
        doAnswer(invocation -> {
            jakarta.servlet.http.HttpServletResponse response = invocation.getArgument(1);
            response.setStatus(401);
            return null;
        }).when(customAuthenticationEntryPoint).commence(any(), any(), any());

        // Stub the mocked access denied handler to return 403 Forbidden
        doAnswer(invocation -> {
            jakarta.servlet.http.HttpServletResponse response = invocation.getArgument(1);
            response.setStatus(403);
            return null;
        }).when(customAccessDeniedHandler).handle(any(), any(), any());
    }

    @Test
    void testActuatorHealthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    void testOtherActuatorEndpointsAreProtected() throws Exception {
        mockMvc.perform(get("/actuator/env")
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }
}
