package com.greenlife.exception;

public class PasswordResetOtpInvalidException extends RuntimeException {
    public PasswordResetOtpInvalidException(String message) {
        super(message);
    }
}
