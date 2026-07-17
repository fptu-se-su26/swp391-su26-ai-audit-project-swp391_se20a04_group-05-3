package com.greenlife.chat.service;

import com.greenlife.exception.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatRateLimiterTest {

    private ChatRateLimiter rateLimiter;
    private Clock mockClock;
    private Instant currentInstant;

    @BeforeEach
    void setUp() {
        currentInstant = Instant.parse("2026-07-16T10:00:00Z");
        mockClock = mock(Clock.class);
        when(mockClock.instant()).thenAnswer(invocation -> currentInstant);
        when(mockClock.getZone()).thenReturn(ZoneId.of("UTC"));

        rateLimiter = new ChatRateLimiter(2, 10, 3, mockClock);
    }

    @Test
    void testRateLimit_WithinLimit() {
        assertDoesNotThrow(() -> rateLimiter.checkRateLimit("user-1"));
        assertDoesNotThrow(() -> rateLimiter.checkRateLimit("user-1"));
    }

    @Test
    void testRateLimit_Exceeded() {
        rateLimiter.checkRateLimit("user-1");
        rateLimiter.checkRateLimit("user-1");

        CustomException exception = assertThrows(CustomException.class, () -> {
            rateLimiter.checkRateLimit("user-1");
        });

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
        assertTrue(exception.getMessage().contains("quá nhiều yêu cầu"));
    }

    @Test
    void testRateLimit_Expiration() {
        rateLimiter.checkRateLimit("user-1");
        rateLimiter.checkRateLimit("user-1");

        currentInstant = currentInstant.plusSeconds(11);

        assertDoesNotThrow(() -> rateLimiter.checkRateLimit("user-1"));
    }

    @Test
    void testMaxKeysEnforced() {
        rateLimiter.checkRateLimit("k1");
        rateLimiter.checkRateLimit("k2");
        rateLimiter.checkRateLimit("k3");

        CustomException exception = assertThrows(CustomException.class, () -> {
            rateLimiter.checkRateLimit("k4");
        });

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
    }

    @Test
    void testStaleKeysCleaned() {
        rateLimiter.checkRateLimit("k1");
        rateLimiter.checkRateLimit("k2");

        currentInstant = currentInstant.plusSeconds(11);

        assertDoesNotThrow(() -> rateLimiter.checkRateLimit("k3"));
        assertDoesNotThrow(() -> rateLimiter.checkRateLimit("k4"));
    }
}
