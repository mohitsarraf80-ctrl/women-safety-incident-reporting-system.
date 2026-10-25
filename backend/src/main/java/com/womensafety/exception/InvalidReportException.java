package com.womensafety.exception;

import org.springframework.http.HttpStatus;

/** Raised when a report payload fails a business rule that Bean Validation cannot express. */
public class InvalidReportException extends ApiException {

    public InvalidReportException(String message) {
        super(HttpStatus.BAD_REQUEST, "invalid-report", message);
    }
}
