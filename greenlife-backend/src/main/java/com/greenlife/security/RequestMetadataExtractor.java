package com.greenlife.security;

import com.greenlife.dto.RequestMetadata;
import jakarta.servlet.http.HttpServletRequest;

public class RequestMetadataExtractor {

    public static RequestMetadata extract(HttpServletRequest request) {
        if (request == null) {
            return new RequestMetadata("unknown", "unknown");
        }

        // Extract IP Address: X-Forwarded-For -> X-Real-IP -> remote address
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        // Extract and truncate User-Agent (max 500 chars)
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }

        return new RequestMetadata(
            ip != null ? ip : "unknown",
            userAgent != null ? userAgent : "unknown"
        );
    }
}
