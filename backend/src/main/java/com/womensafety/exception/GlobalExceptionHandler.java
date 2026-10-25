package com.womensafety.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Converts every failure into a consistent RFC 9457 problem response. Unexpected errors
 * are logged with a stack trace server-side but never returned to the client.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetail> handleApiException(ApiException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getCode(), ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex,
                                                          HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        ex.getBindingResult().getGlobalErrors().forEach(error ->
                errors.putIfAbsent("request", error.getDefaultMessage()));
        return build(HttpStatus.BAD_REQUEST, "validation-failed",
                "Some fields need attention.", request, errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(ConstraintViolationException ex,
                                                                   HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(v ->
                errors.put(v.getPropertyPath().toString(), v.getMessage()));
        return build(HttpStatus.BAD_REQUEST, "validation-failed", "Some fields need attention.", request, errors);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ProblemDetail> handleUnreadable(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "malformed-request",
                "The request body is missing or malformed.", request, null);
    }

    @ExceptionHandler({org.springframework.web.multipart.support.MissingServletRequestPartException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ProblemDetail> handleBadPartOrType(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "invalid-parameter",
                "A request parameter is missing or has an unsupported value.", request, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ProblemDetail> handleUploadTooLarge(MaxUploadSizeExceededException ex,
                                                              HttpServletRequest request) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "upload-too-large",
                "The uploaded file exceeds the 5 MB limit.", request, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(AuthenticationException ex,
                                                              HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "invalid-credentials", "Email or password is incorrect.",
                request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "forbidden",
                "Your role does not permit this action.", request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleIntegrity(DataIntegrityViolationException ex,
                                                         HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "data-conflict",
                "The operation conflicts with an existing record.", request, null);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ProblemDetail> handleOptimisticLock(ObjectOptimisticLockingFailureException ex,
                                                              HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "concurrent-update",
                "This record was updated by someone else. Reload and try again.", request, null);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(NoHandlerFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "not-found", "The requested endpoint does not exist.", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "internal-error",
                "Something went wrong on the server. Please try again.", request, null);
    }

    private ResponseEntity<ProblemDetail> build(HttpStatus status, String code, String detail,
                                                HttpServletRequest request, Map<String, String> errors) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create("https://womensafety.local/errors/" + code));
        problem.setTitle(titleFor(status));
        problem.setProperty("code", code);
        problem.setProperty("timestamp", Instant.now().toString());
        if (request != null) {
            problem.setInstance(URI.create(request.getRequestURI()));
        }
        if (errors != null && !errors.isEmpty()) {
            problem.setProperty("errors", errors);
        }
        return ResponseEntity.status(status).body(problem);
    }

    private String titleFor(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Invalid request";
            case UNAUTHORIZED -> "Authentication required";
            case FORBIDDEN -> "Access denied";
            case NOT_FOUND -> "Not found";
            case CONFLICT -> "Conflict";
            case PAYLOAD_TOO_LARGE -> "Upload too large";
            case TOO_MANY_REQUESTS -> "Too many requests";
            default -> "Request failed";
        };
    }
}
