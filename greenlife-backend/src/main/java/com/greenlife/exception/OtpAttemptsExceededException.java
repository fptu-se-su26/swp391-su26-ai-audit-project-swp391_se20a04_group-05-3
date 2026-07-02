package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class OtpAttemptsExceededException extends CustomException {
    public OtpAttemptsExceededException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
