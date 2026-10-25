package com.womensafety.exception;

import org.springframework.http.HttpStatus;

/**
 * Deliberately generic: the response must not reveal whether a Report ID exists, which
 * would allow enumeration of reports by an attacker.
 */
public class TrackingVerificationException extends ApiException {

    public TrackingVerificationException() {
        super(HttpStatus.NOT_FOUND, "tracking-failed",
                "No report matches that Report ID and tracking code.");
    }
}
