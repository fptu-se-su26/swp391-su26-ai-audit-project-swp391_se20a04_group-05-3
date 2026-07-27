package com.greenlife.exception;

public class InvalidStoreStatusTransitionException extends RuntimeException {
    public InvalidStoreStatusTransitionException(String message) {
        super(message);
    }
}
