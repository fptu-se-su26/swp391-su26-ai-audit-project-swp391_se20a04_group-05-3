package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class OtpExpiredException extends CustomException {
    public OtpExpiredException(String message) {
        super(message, HttpStatus.GONE);
    }
}
