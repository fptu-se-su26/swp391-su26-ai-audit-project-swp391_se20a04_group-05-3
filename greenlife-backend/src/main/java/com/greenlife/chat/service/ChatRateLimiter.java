package com.greenlife.chat.service;

import com.greenlife.exception.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatRateLimiter {

    private final Clock clock;
    private final int maxRequests;
    private final int windowSeconds;
    private final int maxKeys;

    private final Map<String, Deque<Instant>> keyTimestamps = new ConcurrentHashMap<>();

    public ChatRateLimiter(
            @Value("${greenlife.ai.chat-rate-limit-max:10}") int maxRequests,
            @Value("${greenlife.ai.chat-rate-limit-window-seconds:60}") int windowSeconds,
            @Value("${greenlife.ai.chat-rate-limit-max-keys:1000}") int maxKeys,
            Clock clock) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
        this.maxKeys = maxKeys;
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    public ChatRateLimiter(
            @Value("${greenlife.ai.chat-rate-limit-max:10}") int maxRequests,
            @Value("${greenlife.ai.chat-rate-limit-window-seconds:60}") int windowSeconds,
            @Value("${greenlife.ai.chat-rate-limit-max-keys:1000}") int maxKeys) {
        this(maxRequests, windowSeconds, maxKeys, Clock.systemUTC());
    }

    public synchronized void checkRateLimit(String key) {
        Instant now = clock.instant();
        Instant windowStart = now.minusSeconds(windowSeconds);

        Deque<Instant> timestamps = keyTimestamps.computeIfAbsent(key, k -> new ArrayDeque<>());
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
            timestamps.pollFirst();
        }

        if (keyTimestamps.size() > maxKeys) {
            cleanupStaleKeys(now);
            if (keyTimestamps.size() >= maxKeys && !keyTimestamps.containsKey(key)) {
                throw new CustomException("Hệ thống trợ lý ảo đang bận. Vui lòng quay lại sau.", HttpStatus.TOO_MANY_REQUESTS);
            }
        }

        if (timestamps.size() >= maxRequests) {
            throw new CustomException("Bạn đã gửi quá nhiều yêu cầu trò chuyện. Vui lòng thử lại sau.", HttpStatus.TOO_MANY_REQUESTS);
        }

        timestamps.addLast(now);
    }

    private synchronized void cleanupStaleKeys(Instant now) {
        Instant windowStart = now.minusSeconds(windowSeconds);
        Iterator<Map.Entry<String, Deque<Instant>>> iterator = keyTimestamps.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Deque<Instant>> entry = iterator.next();
            Deque<Instant> timestamps = entry.getValue();
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
                timestamps.pollFirst();
            }
            if (timestamps.isEmpty()) {
                iterator.remove();
            }
        }
    }

    public int getMaxRequests() {
        return maxRequests;
    }

    public int getWindowSeconds() {
        return windowSeconds;
    }

    public int getMaxKeys() {
        return maxKeys;
    }

    public int getTrackedKeyCount() {
        return keyTimestamps.size();
    }

    public void clear() {
        keyTimestamps.clear();
    }
}
