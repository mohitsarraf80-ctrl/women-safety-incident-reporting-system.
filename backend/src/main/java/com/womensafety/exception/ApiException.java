package com.womensafety.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for expected, client-facing failures. The global handler converts these
 * into RFC 9457 ProblemDetail responses without leaking stack traces.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    protected ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
