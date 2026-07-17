package com.greenlife.chat.controller;

import com.greenlife.chat.dto.ChatRequest;
import com.greenlife.chat.dto.ChatResponse;
import com.greenlife.chat.service.ChatService;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest chatRequest,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {

        User user = currentUserResolver.resolveUserOptional(userDetails);
        String rateLimitKey;
        if (user != null) {
            rateLimitKey = "user:" + user.getId();
        } else {
            rateLimitKey = request.getRemoteAddr();
            if (rateLimitKey == null || rateLimitKey.isBlank()) {
                rateLimitKey = "guest-unknown";
            }
        }

        ChatResponse response = chatService.chat(
                chatRequest.getQuestion(),
                chatRequest.getCurrentRoute(),
                user,
                rateLimitKey
        );

        return ResponseEntity.ok(response);
    }
}
