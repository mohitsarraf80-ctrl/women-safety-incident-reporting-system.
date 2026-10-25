package com.womensafety.exception;

import org.springframework.http.HttpStatus;

public class InvalidEvidenceException extends ApiException {

    public InvalidEvidenceException(String message) {
        super(HttpStatus.BAD_REQUEST, "invalid-evidence", message);
    }
}
