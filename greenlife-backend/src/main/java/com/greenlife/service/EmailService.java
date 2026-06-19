package com.greenlife.service;

public interface EmailService {
    void sendVerificationOtp(String email, String otp);
    void sendPasswordResetOtp(String email, String otp);
}
