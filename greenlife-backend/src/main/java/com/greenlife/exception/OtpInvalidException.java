package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class OtpInvalidException extends CustomException {
    public OtpInvalidException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
