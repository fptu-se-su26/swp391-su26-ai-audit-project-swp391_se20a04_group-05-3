package com.greenlife.exception;

public class PasswordResetOtpExpiredException extends RuntimeException {
    public PasswordResetOtpExpiredException(String message) {
        super(message);
    }
}
