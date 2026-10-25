package com.womensafety.exception;

import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends ApiException {

    public InvalidCredentialsException() {
        super(HttpStatus.UNAUTHORIZED, "invalid-credentials", "Email or password is incorrect.");
    }
}
