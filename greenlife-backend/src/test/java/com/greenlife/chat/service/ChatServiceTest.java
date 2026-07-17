package com.greenlife.chat.service;

import com.greenlife.ai.service.GeminiProviderService;
import com.greenlife.chat.dto.ChatResponse;
import com.greenlife.chat.dto.GeminiChatResult;
import com.greenlife.chat.dto.SuggestedAction;
import com.greenlife.exception.CustomException;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ChatServiceTest {

    private GeminiProviderService geminiProvider;
    private ChatRateLimiter rateLimiter;
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        geminiProvider = mock(GeminiProviderService.class);
        rateLimiter = mock(ChatRateLimiter.class);
        chatService = new ChatService(geminiProvider, rateLimiter);
    }

    @Test
    void testValidStructuredAnswer() {
        GeminiChatResult mockResult = new GeminiChatResult("Xin chào! Tôi có thể giúp gì cho bạn?", List.of("nav_shop", "nav_booking"));
        when(geminiProvider.generateChat(anyString(), anyString())).thenReturn(mockResult);

        ChatResponse response = chatService.chat("Chào", "home", null, "test-ip");

        assertNotNull(response);
        assertEquals("Xin chào! Tôi có thể giúp gì cho bạn?", response.getAnswer());
        assertEquals(2, response.getSuggestedActions().size());
        assertEquals("nav_shop", response.getSuggestedActions().get(0).getActionId());
    }

    @Test
    void testUnknownActionIdsDiscarded() {
        GeminiChatResult mockResult = new GeminiChatResult("Xin chào!", List.of("nav_shop", "invalid_action_id"));
        when(geminiProvider.generateChat(anyString(), anyString())).thenReturn(mockResult);

        ChatResponse response = chatService.chat("Chào", "home", null, "test-ip");

        assertNotNull(response);
        assertEquals(1, response.getSuggestedActions().size());
        assertEquals("nav_shop", response.getSuggestedActions().get(0).getActionId());
    }

    @Test
    void testDuplicateActionIdsRemoved() {
        GeminiChatResult mockResult = new GeminiChatResult("Xin chào!", List.of("nav_shop", "nav_shop"));
        when(geminiProvider.generateChat(anyString(), anyString())).thenReturn(mockResult);

        ChatResponse response = chatService.chat("Chào", "home", null, "test-ip");

        assertNotNull(response);
        assertEquals(1, response.getSuggestedActions().size());
        assertEquals("nav_shop", response.getSuggestedActions().get(0).getActionId());
    }

    @Test
    void testRoleIncompatibleActionsDiscarded() {
        Role storeRole = Role.builder().name("STORE_OWNER").build();
        User storeUser = User.builder().id(1).role(storeRole).build();

        GeminiChatResult mockResult = new GeminiChatResult("Xin chào!", List.of("nav_store_register", "nav_store_dashboard"));
        when(geminiProvider.generateChat(anyString(), anyString())).thenReturn(mockResult);

        ChatResponse response = chatService.chat("Chào", "home", storeUser, "user-1");

        assertNotNull(response);
        assertEquals(1, response.getSuggestedActions().size());
        assertEquals("nav_store_dashboard", response.getSuggestedActions().get(0).getActionId());
    }

    @Test
    void testGuestOnlyAndAuthOnlyFiltering() {
        GeminiChatResult mockResult = new GeminiChatResult("Xin chào!", List.of("nav_auth", "nav_customer_dashboard"));
        when(geminiProvider.generateChat(anyString(), anyString())).thenReturn(mockResult);

        ChatResponse guestResponse = chatService.chat("Chào", "home", null, "test-ip");

        assertNotNull(guestResponse);
        assertEquals(1, guestResponse.getSuggestedActions().size());
        assertEquals("nav_auth", guestResponse.getSuggestedActions().get(0).getActionId());

        Role customerRole = Role.builder().name("CUSTOMER").build();
        User customerUser = User.builder().id(2).role(customerRole).build();

        ChatResponse authResponse = chatService.chat("Chào", "home", customerUser, "user-2");

        assertNotNull(authResponse);
        assertEquals(1, authResponse.getSuggestedActions().size());
        assertEquals("nav_customer_dashboard", authResponse.getSuggestedActions().get(0).getActionId());
    }

    @Test
    void testBlankQuestionRejected() {
        CustomException exception = assertThrows(CustomException.class, () -> {
            chatService.chat("   ", "home", null, "test-ip");
        });
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void testOversizedQuestionRejected() {
        String longQuestion = "a".repeat(1001);
        CustomException exception = assertThrows(CustomException.class, () -> {
            chatService.chat(longQuestion, "home", null, "test-ip");
        });
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void testInvalidRouteRejected() {
        CustomException exception = assertThrows(CustomException.class, () -> {
            chatService.chat("Chào", "invalid-route", null, "test-ip");
        });
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }
}
