package com.greenlife.exception;

import com.greenlife.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private HttpServletRequest request;

    private ApiErrorResponse buildResponse(String message) {
        return ApiErrorResponse.builder()
                .error(message)
                .timestamp(LocalDateTime.now())
                .path(request != null ? request.getRequestURI() : null)
                .build();
    }

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiErrorResponse> handleCustomException(CustomException ex) {
        HttpStatus status = ex.getStatus() != null ? ex.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(OtpExpiredException.class)
    public ResponseEntity<ApiErrorResponse> handleOtpExpiredException(OtpExpiredException ex) {
        return ResponseEntity.status(HttpStatus.GONE).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(OtpInvalidException.class)
    public ResponseEntity<ApiErrorResponse> handleOtpInvalidException(OtpInvalidException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(OtpAttemptsExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleOtpAttemptsExceededException(OtpAttemptsExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(OtpRateLimitException.class)
    public ResponseEntity<ApiErrorResponse> handleOtpRateLimitException(OtpRateLimitException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(UserNotPendingVerificationException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotPendingVerificationException(UserNotPendingVerificationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(RefreshTokenReplayAttackException.class)
    public ResponseEntity<ApiErrorResponse> handleRefreshTokenReplayAttackException(RefreshTokenReplayAttackException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccountLockedException(AccountLockedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(AccountDisabledException.class)
    public ResponseEntity<ApiErrorResponse> handleAccountDisabledException(AccountDisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailNotVerifiedException(EmailNotVerifiedException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(PasswordResetOtpExpiredException.class)
    public ResponseEntity<ApiErrorResponse> handlePasswordResetOtpExpiredException(PasswordResetOtpExpiredException ex) {
        return ResponseEntity.status(HttpStatus.GONE).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(PasswordResetOtpInvalidException.class)
    public ResponseEntity<ApiErrorResponse> handlePasswordResetOtpInvalidException(PasswordResetOtpInvalidException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(PasswordMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handlePasswordMismatchException(PasswordMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(PasswordReuseException.class)
    public ResponseEntity<ApiErrorResponse> handlePasswordReuseException(PasswordReuseException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(IncorrectPasswordException.class)
    public ResponseEntity<ApiErrorResponse> handleIncorrectPasswordException(IncorrectPasswordException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(InvalidStoreStatusTransitionException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidStoreStatusTransitionException(InvalidStoreStatusTransitionException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @SuppressWarnings("null")
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String firstError = ex.getBindingResult().getAllErrors().stream()
                .map(org.springframework.validation.ObjectError::getDefaultMessage)
                .findFirst()
                .orElse("Dữ liệu đầu vào không hợp lệ");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildResponse(firstError));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(buildResponse("Email hoặc mật khẩu không chính xác"));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiErrorResponse> handleLockedException(LockedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(buildResponse("Tài khoản của bạn đã bị khóa"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(buildResponse("Access Denied"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(buildResponse("Dữ liệu không hợp lệ hoặc đã tồn tại trong hệ thống"));
    }

    @ExceptionHandler({
            org.springframework.orm.ObjectOptimisticLockingFailureException.class,
            org.springframework.dao.OptimisticLockingFailureException.class,
            jakarta.persistence.OptimisticLockException.class,
            org.springframework.transaction.TransactionSystemException.class
    })
    public ResponseEntity<ApiErrorResponse> handleOptimisticLockingFailure(Exception ex) {
        Throwable cause = ex;
        boolean isOptimisticLock = false;
        while (cause != null) {
            if (cause instanceof jakarta.persistence.OptimisticLockException
                    || cause instanceof org.springframework.dao.OptimisticLockingFailureException) {
                isOptimisticLock = true;
                break;
            }
            cause = cause.getCause();
        }

        if (isOptimisticLock) {
            String message = "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang.";
            if (request != null && request.getRequestURI() != null && request.getRequestURI().contains("/api/blogs")) {
                message = "Blog has been modified by another user";
            }
            return ResponseEntity.status(HttpStatus.CONFLICT).body(buildResponse(message));
        }

        if (ex instanceof RuntimeException) {
            throw (RuntimeException) ex;
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildResponse(ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorResponse> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildResponse("Đã xảy ra lỗi thực thi: " + ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildResponse("Đã xảy ra lỗi hệ thống: " + ex.getMessage()));
    }
}
