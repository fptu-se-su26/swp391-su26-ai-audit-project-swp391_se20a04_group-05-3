package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class AccountDisabledException extends CustomException {
    public AccountDisabledException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
