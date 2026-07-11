package com.greenlife.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Phase 4-J6: Startup diagnostic that logs Hikari pool configuration to confirm
 * the runtime pool matches the source application.properties.
 * <p>
 * Logs poolName, maximumPoolSize, minimumIdle, and key timeouts.
 * Does NOT log username, password, or secrets.
 * Does NOT run extra DB queries.
 * </p>
 */
@Component
@Slf4j
public class DataSourceDiagnostics {

    private final DataSource dataSource;

    public DataSourceDiagnostics(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationStartedEvent.class)
    public void logHikariDiagnostics() {
        if (dataSource instanceof HikariDataSource hikari) {
            // Sanitize JDBC URL — remove password param if present
            String rawUrl = hikari.getJdbcUrl();
            String safeUrl = rawUrl != null
                    ? rawUrl.replaceAll("(?i)password=[^;]*", "password=***")
                    : "(null)";

            log.info("=== [GreenLife Hikari Diagnostics] ===");
            log.info("  poolName              = {}", hikari.getPoolName());
            log.info("  maximumPoolSize       = {}", hikari.getMaximumPoolSize());
            log.info("  minimumIdle           = {}", hikari.getMinimumIdle());
            log.info("  connectionTimeout(ms) = {}", hikari.getConnectionTimeout());
            log.info("  validationTimeout(ms) = {}", hikari.getValidationTimeout());
            log.info("  idleTimeout(ms)       = {}", hikari.getIdleTimeout());
            log.info("  maxLifetime(ms)       = {}", hikari.getMaxLifetime());
            log.info("  keepaliveTime(ms)     = {}", hikari.getKeepaliveTime());
            log.info("  leakDetectionThreshold(ms) = {}", hikari.getLeakDetectionThreshold());
            log.info("  jdbcUrl (sanitized)   = {}", safeUrl);
            log.info("=== [End Hikari Diagnostics] ===");
        } else {
            log.warn("[GreenLife Hikari Diagnostics] DataSource is NOT a HikariDataSource: {}", dataSource.getClass().getName());
        }
    }
}
