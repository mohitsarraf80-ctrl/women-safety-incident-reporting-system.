package com.womensafety.exception;

import org.springframework.http.HttpStatus;

/** Referenced but not exposed: the response body is deliberately identical to a 404 wording-free denial. */
public class UnauthorizedIncidentAccessException extends ApiException {

    public UnauthorizedIncidentAccessException() {
        super(HttpStatus.FORBIDDEN, "incident-access-denied",
                "You are not authorised to access this incident.");
    }
}
