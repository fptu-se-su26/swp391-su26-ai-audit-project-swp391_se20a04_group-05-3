package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class OtpRateLimitException extends CustomException {
    public OtpRateLimitException(String message) {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
    }
}
