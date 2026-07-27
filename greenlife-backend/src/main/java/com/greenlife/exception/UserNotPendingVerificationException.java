package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class UserNotPendingVerificationException extends CustomException {
    public UserNotPendingVerificationException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
