package com.greenlife.security.dto;

public record RequestMetadata(
    String ipAddress,
    String userAgent
) {}
