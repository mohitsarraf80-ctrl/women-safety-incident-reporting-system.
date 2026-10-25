package com.womensafety.exception;

import org.springframework.http.HttpStatus;

public class ResponderNotFoundException extends ApiException {

    public ResponderNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "responder-not-found", "No responder exists with id " + id + ".");
    }
}
