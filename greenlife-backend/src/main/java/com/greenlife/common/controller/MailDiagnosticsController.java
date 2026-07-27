package com.greenlife.common.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dev")
@Profile("dev")
public class MailDiagnosticsController {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.port}")
    private int port;

    @Value("${spring.mail.properties.mail.smtp.auth:false}")
    private String smtpAuth;

    public MailDiagnosticsController(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    @GetMapping("/mail-health")
    public ResponseEntity<Map<String, Object>> getMailHealth() {
        Map<String, Object> response = new LinkedHashMap<>();
        
        try {
            if (javaMailSender instanceof JavaMailSenderImpl) {
                JavaMailSenderImpl impl = (JavaMailSenderImpl) javaMailSender;
                impl.testConnection();
                
                response.put("host", host);
                response.put("port", port);
                response.put("authenticationEnabled", Boolean.parseBoolean(smtpAuth));
                response.put("connectionStatus", "SUCCESS");
            } else {
                throw new IllegalStateException("JavaMailSender is not an instance of JavaMailSenderImpl");
            }
        } catch (Exception e) {
            response.put("connectionStatus", "FAILED");
            response.put("failureReason", e.getMessage() != null ? e.getMessage() : e.toString());
        }

        return ResponseEntity.ok(response);
    }
}
