package com.greenlife.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MailPropertiesValidator {

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.port:0}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${spring.mail.properties.mail.smtp.auth:false}")
    private String smtpAuth;

    @PostConstruct
    public void validate() {
        if (host == null || host.trim().isEmpty()) {
            throw new IllegalStateException("SMTP Host configuration (spring.mail.host) is missing or empty.");
        }
        if (port <= 0 || port > 65535) {
            throw new IllegalStateException("SMTP Port configuration (spring.mail.port) is invalid: " + port);
        }
        if (Boolean.parseBoolean(smtpAuth)) {
            if (username == null || username.trim().isEmpty()) {
                throw new IllegalStateException("SMTP Authentication is enabled (spring.mail.properties.mail.smtp.auth=true) but username (spring.mail.username) is missing or empty.");
            }
            if (password == null || password.trim().isEmpty()) {
                throw new IllegalStateException("SMTP Authentication is enabled (spring.mail.properties.mail.smtp.auth=true) but password (spring.mail.password) is missing or empty.");
            }
        }
    }
}
