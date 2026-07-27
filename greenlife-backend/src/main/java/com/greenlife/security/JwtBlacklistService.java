package com.greenlife.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * JWT blacklist service with a lightweight Redis circuit-breaker.
 *
 * <p>When Redis is unavailable the service switches to the in-memory fallback
 * and does NOT attempt a Redis call again until {@code app.security.redis-fallback-cooldown-ms}
 * milliseconds have elapsed. This prevents every authenticated request from
 * blocking on a Redis connection timeout.</p>
 *
 * <p>Behaviour summary:
 * <ul>
 *   <li>Redis available → use Redis as normal (production path)</li>
 *   <li>Redis unavailable → log once, use in-memory blacklist, retry after cooldown</li>
 *   <li>Redis recovers during cooldown → restored automatically on next retry</li>
 * </ul>
 * </p>
 */
@Service
@Slf4j
public class JwtBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private final JwtService jwtService;

    /**
     * Cooldown period in ms before retrying Redis after a failure.
     * Override via {@code app.security.redis-fallback-cooldown-ms} in application.properties.
     */
    @Value("${app.security.redis-fallback-cooldown-ms:30000}")
    private long redisFallbackCooldownMs;

    // Circuit-breaker state
    private final AtomicBoolean redisAvailable = new AtomicBoolean(true);
    private final AtomicLong   redisRetryAfter = new AtomicLong(0L);

    // In-memory fallback map: SHA-256(token) -> Expiration Date
    private final Map<String, Date> inMemoryBlacklist = new ConcurrentHashMap<>();

    public JwtBlacklistService(StringRedisTemplate redisTemplate, JwtService jwtService) {
        this.redisTemplate = redisTemplate;
        this.jwtService    = jwtService;
    }

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

    // -----------------------------------------------------------------------
    // Circuit-breaker helpers
    // -----------------------------------------------------------------------

    /**
     * Returns true if Redis should be attempted for this call.
     * <p>
     * If Redis was previously marked as unavailable and the cooldown has NOT
     * expired, returns false immediately (no network I/O).
     * If the cooldown HAS expired, performs a lightweight probe (ping) to
     * decide whether to restore the Redis path.
     * </p>
     */
    private boolean isRedisCurrentlyAvailable() {
        if (redisAvailable.get()) {
            return true; // Fast path: Redis is considered up
        }
        // Cooldown still active — skip Redis
        if (System.currentTimeMillis() < redisRetryAfter.get()) {
            return false;
        }
        // Cooldown expired: attempt a lightweight probe
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            // Probe succeeded — restore Redis path
            redisAvailable.set(true);
            log.info("[Redis circuit-breaker] Redis connection restored. Resuming Redis blacklist.");
            return true;
        } catch (Exception probe) {
            // Still down: reset cooldown
            redisRetryAfter.set(System.currentTimeMillis() + redisFallbackCooldownMs);
            return false;
        }
    }

    /**
     * Marks Redis as unavailable and schedules the next retry.
     * Logs the first failure at WARN level; subsequent failures within the
     * cooldown window are silently skipped (no log spam).
     */
    private void markRedisUnavailable(String context, String errorMessage) {
        boolean wasAvailable = redisAvailable.getAndSet(false);
        redisRetryAfter.set(System.currentTimeMillis() + redisFallbackCooldownMs);
        if (wasAvailable) {
            // Log only on first transition to unavailable
            log.warn("[Redis circuit-breaker] Redis unavailable ({}): {}. "
                    + "Switching to in-memory blacklist fallback for {} ms. "
                    + "Redis will be retried after cooldown.",
                    context, errorMessage, redisFallbackCooldownMs);
        }
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Blacklist the given access token until its expiration.
     * <p>
     * Writes to Redis when available, otherwise writes to in-memory fallback.
     * Redis is not attempted while the circuit-breaker is open.
     * </p>
     */
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        String hashedToken = hashToken(token);
        Date expirationDate;
        long ttlMillis;

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

        if (isRedisCurrentlyAvailable()) {
            try {
                redisTemplate.opsForValue().set(
                        getRedisKey(hashedToken),
                        "blacklisted",
                        Duration.ofMillis(ttlMillis)
                );
                log.info("Access token successfully blacklisted in Redis. TTL: {} ms", ttlMillis);
                return;
            } catch (Exception e) {
                markRedisUnavailable("blacklistToken", e.getMessage());
            }
        }

        // Fallback: store in-memory
        inMemoryBlacklist.put(hashedToken, expirationDate);
    }

    /**
     * Check if the given access token is blacklisted.
     * <p>
     * Checks Redis when available; falls through to in-memory map when the
     * circuit-breaker is open. No Redis I/O occurs during the cooldown window.
     * </p>
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        String hashedToken = hashToken(token);

        if (isRedisCurrentlyAvailable()) {
            try {
                Boolean hasKey = redisTemplate.hasKey(getRedisKey(hashedToken));
                return Boolean.TRUE.equals(hasKey);
            } catch (Exception e) {
                markRedisUnavailable("isBlacklisted", e.getMessage());
                // Fall through to in-memory check
            }
        }

        // Fallback: check in-memory map
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
