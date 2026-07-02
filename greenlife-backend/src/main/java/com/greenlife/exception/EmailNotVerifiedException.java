package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class EmailNotVerifiedException extends CustomException {
    public EmailNotVerifiedException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
