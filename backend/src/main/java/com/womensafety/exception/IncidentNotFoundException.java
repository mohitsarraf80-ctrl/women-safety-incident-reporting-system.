package com.womensafety.exception;

import org.springframework.http.HttpStatus;

public class IncidentNotFoundException extends ApiException {

    public IncidentNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND, "incident-not-found", "No incident was found for reference " + identifier + ".");
    }
}
