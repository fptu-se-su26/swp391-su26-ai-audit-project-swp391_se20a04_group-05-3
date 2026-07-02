package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends CustomException {
    public AccountLockedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
