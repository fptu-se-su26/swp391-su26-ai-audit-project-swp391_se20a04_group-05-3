package com.greenlife.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.chat.dto.ChatRequest;
import com.greenlife.chat.dto.ChatResponse;
import com.greenlife.chat.dto.SuggestedAction;
import com.greenlife.chat.service.ChatService;
import com.greenlife.security.CurrentUserResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChatControllerTest {

    private MockMvc mockMvc;
    private ChatService chatService;
    private CurrentUserResolver currentUserResolver;
    private ObjectMapper objectMapper;
    private UserDetails mockUserDetails;

    private final HandlerMethodArgumentResolver authenticationPrincipalResolver = new HandlerMethodArgumentResolver() {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                      NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
            return mockUserDetails;
        }
    };

    @BeforeEach
    void setUp() {
        chatService = mock(ChatService.class);
        currentUserResolver = mock(CurrentUserResolver.class);
        objectMapper = new ObjectMapper();
        mockUserDetails = null;

        ChatController chatController = new ChatController(chatService, currentUserResolver);
        mockMvc = MockMvcBuilders.standaloneSetup(chatController)
                .setCustomArgumentResolvers(authenticationPrincipalResolver)
                .build();
    }

    @Test
    void testPublicRequestSuccess() throws Exception {
        ChatRequest request = new ChatRequest("Chào", "home");
        ChatResponse expectedResponse = new ChatResponse("Xin chào!", List.of(new SuggestedAction("nav_shop", "Cửa hàng", "shop")));

        when(currentUserResolver.resolveUserOptional(any())).thenReturn(null);
        when(chatService.chat(eq("Chào"), eq("home"), eq(null), anyString())).thenReturn(expectedResponse);

        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Xin chào!"))
                .andExpect(jsonPath("$.suggestedActions[0].actionId").value("nav_shop"));
    }

    @Test
    void testBlankQuestionRejected() throws Exception {
        ChatRequest request = new ChatRequest("   ", "home");

        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testOversizedQuestionRejected() throws Exception {
        ChatRequest request = new ChatRequest("a".repeat(1001), "home");

        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
