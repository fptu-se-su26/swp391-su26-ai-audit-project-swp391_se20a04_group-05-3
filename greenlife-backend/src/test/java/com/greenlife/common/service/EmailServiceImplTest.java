package com.greenlife.common.service;

import com.greenlife.exception.CustomException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class EmailServiceImplTest {

    private JavaMailSender mailSender;
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        emailService = new EmailServiceImpl(mailSender);
        ReflectionTestUtils.setField(emailService, "smtpHost", "smtp.test.com");
        ReflectionTestUtils.setField(emailService, "senderEmail", "sender@test.com");
    }

    @Test
    void testSendVerificationOtpSuccess() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act & Assert
        assertDoesNotThrow(() -> emailService.sendVerificationOtp("test@example.com", "123456"));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void testSendVerificationOtpSmtpFailure() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP error")).when(mailSender).send(mimeMessage);

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () ->
            emailService.sendVerificationOtp("test@example.com", "123456")
        );
        assertEquals("Gửi mail OTP thất bại do sự cố kết nối. Vui lòng thử lại sau.", exception.getMessage());
        assertEquals(503, exception.getStatus().value());
    }

    @Test
    void testSendVerificationOtpMissingConfig() {
        // Arrange
        ReflectionTestUtils.setField(emailService, "senderEmail", "");

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () ->
            emailService.sendVerificationOtp("test@example.com", "123456")
        );
        assertEquals("Cấu hình địa chỉ gửi mail (sender) chưa đầy đủ.", exception.getMessage());
        assertEquals(503, exception.getStatus().value());
    }

    @Test
    void testSendPasswordResetOtpSuccess() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act & Assert
        assertDoesNotThrow(() -> emailService.sendPasswordResetOtp("test@example.com", "123456"));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void testSendPasswordResetOtpSmtpFailure() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP error")).when(mailSender).send(mimeMessage);

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () ->
            emailService.sendPasswordResetOtp("test@example.com", "123456")
        );
        assertEquals("Gửi mail OTP thất bại do sự cố kết nối. Vui lòng thử lại sau.", exception.getMessage());
        assertEquals(503, exception.getStatus().value());
    }

    @Test
    void testSendPasswordResetOtpMissingConfig() {
        // Arrange
        ReflectionTestUtils.setField(emailService, "senderEmail", "");

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () ->
            emailService.sendPasswordResetOtp("test@example.com", "123456")
        );
        assertEquals("Cấu hình địa chỉ gửi mail (sender) chưa đầy đủ.", exception.getMessage());
        assertEquals(503, exception.getStatus().value());
    }
}
