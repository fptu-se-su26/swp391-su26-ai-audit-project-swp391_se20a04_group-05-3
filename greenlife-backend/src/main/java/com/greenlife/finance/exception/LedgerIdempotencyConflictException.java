package com.greenlife.finance.exception;

public class LedgerIdempotencyConflictException extends RuntimeException {
    public LedgerIdempotencyConflictException(String message) {
        super(message);
    }
}
