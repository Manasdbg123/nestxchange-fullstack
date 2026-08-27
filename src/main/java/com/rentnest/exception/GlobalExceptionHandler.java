package com.rentnest.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Translates exceptions into the {@link ApiError} envelope.
 *
 * <p>Client-caused failures (4xx) carry a specific, actionable message.
 * Server faults (5xx) are logged in full with a correlation id but the response
 * carries only that id - exception text can disclose SQL, file paths and class
 * names, so it never crosses the network.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(BusinessValidationException.class)
    public ResponseEntity<ApiError> handleBusinessValidation(BusinessValidationException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiError> handleUnauthorizedAccess(UnauthorizedAccessException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "You do not have permission to perform this action.", request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        // Deliberately vague: distinguishing "no such user" from "wrong password"
        // turns the login form into an account-enumeration oracle.
        return build(HttpStatus.UNAUTHORIZED, "Incorrect email or password.", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Authentication failed. Please sign in again.", request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        ex.getBindingResult().getGlobalErrors()
                .forEach(error -> fieldErrors.putIfAbsent(error.getObjectName(), error.getDefaultMessage()));

        ApiError body = ApiError.of(HttpStatus.BAD_REQUEST,
                "Some of the details you entered are not valid.", request.getRequestURI());
        body.setFieldErrors(fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violation ->
                fieldErrors.putIfAbsent(violation.getPropertyPath().toString(), violation.getMessage()));

        ApiError body = ApiError.of(HttpStatus.BAD_REQUEST,
                "Some of the details you entered are not valid.", request.getRequestURI());
        body.setFieldErrors(fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String message = String.format("'%s' is not a valid value for '%s'.", ex.getValue(), ex.getName());
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST,
                String.format("Required parameter '%s' is missing.", ex.getParameterName()), request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "The request body is missing or malformed.", request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleUploadTooLarge(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE,
                "Those images are too large. Please upload smaller files and try again.", request);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiError> handleNoHandler(NoHandlerFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "No endpoint matches this request.", request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String message = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        return ResponseEntity.status(status).body(ApiError.of(status, message, request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        String reference = UUID.randomUUID().toString().substring(0, 8);
        log.error("Unhandled exception [ref={}] on {} {}", reference, request.getMethod(), request.getRequestURI(), ex);

        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong on our side. Quote reference " + reference + " if you contact support.",
                request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(ApiError.of(status, message, request.getRequestURI()));
    }
}
