package com.greenlife.exception;

import org.springframework.http.HttpStatus;

public class RefreshTokenReplayAttackException extends CustomException {
    public RefreshTokenReplayAttackException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
