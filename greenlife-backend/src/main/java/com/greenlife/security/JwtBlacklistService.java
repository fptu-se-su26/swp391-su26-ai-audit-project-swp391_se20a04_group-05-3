package com.greenlife.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private final JwtService jwtService;

    // In-memory fallback map: SHA-256(token) -> Expiration Date
    private final Map<String, Date> inMemoryBlacklist = new ConcurrentHashMap<>();

    /**
     * Hashes a token using SHA-256 to ensure raw tokens are never stored.
     */
    private String hashToken(String token) {
        if (token == null) return null;
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating SHA-256 hash of token", e);
        }
    }

    /**
     * Blacklist the given access token until its expiration.
     */
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        String hashedToken = hashToken(token);
        Date expirationDate = null;
        long ttlMillis = 0;

        try {
            expirationDate = jwtService.extractExpiration(token);
            ttlMillis = expirationDate.getTime() - System.currentTimeMillis();
        } catch (Exception e) {
            log.error("Failed to extract expiration from token for blacklisting", e);
            return;
        }

        if (ttlMillis <= 0) {
            return; // Already expired
        }

        // Try writing to Redis
        try {
            redisTemplate.opsForValue().set(
                    getRedisKey(hashedToken),
                    "blacklisted",
                    Duration.ofMillis(ttlMillis)
            );
            log.info("Access token successfully blacklisted in Redis. TTL: {} ms", ttlMillis);
        } catch (Exception e) {
            log.warn("Redis is unavailable for blacklisting token: {}. Falling back to in-memory cache.", e.getMessage());
            inMemoryBlacklist.put(hashedToken, expirationDate);
        }
    }

    /**
     * Check if the given access token is blacklisted.
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        String hashedToken = hashToken(token);

        // Try reading from Redis
        try {
            Boolean hasKey = redisTemplate.hasKey(getRedisKey(hashedToken));
            return Boolean.TRUE.equals(hasKey);
        } catch (Exception e) {
            log.warn("Redis is unavailable on blacklist check: {}. Falling back to checking in-memory cache.", e.getMessage());
            Date expiration = inMemoryBlacklist.get(hashedToken);
            if (expiration == null) {
                return false;
            }
            if (expiration.before(new Date())) {
                inMemoryBlacklist.remove(hashedToken); // Lazy clean
                return false;
            }
            return true;
        }
    }

    private String getRedisKey(String hashedToken) {
        return "jwt:blacklist:" + hashedToken;
    }

    /**
     * Scheduled cleanup task that runs every 5 minutes to clean up expired in-memory blacklist tokens.
     */
    @Scheduled(fixedRate = 300000)
    public void cleanExpiredInMemoryTokens() {
        Date now = new Date();
        int beforeSize = inMemoryBlacklist.size();
        inMemoryBlacklist.entrySet().removeIf(entry -> entry.getValue().before(now));
        int afterSize = inMemoryBlacklist.size();
        if (beforeSize != afterSize) {
            log.info("Cleaned up {} expired tokens from in-memory blacklist fallback.", (beforeSize - afterSize));
        }
    }

    // Package-private method to allow test introspection
    protected Map<String, Date> getInMemoryBlacklist() {
        return inMemoryBlacklist;
    }
}
