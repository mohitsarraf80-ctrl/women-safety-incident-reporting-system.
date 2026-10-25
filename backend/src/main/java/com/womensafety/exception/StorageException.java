package com.womensafety.exception;

import org.springframework.http.HttpStatus;

public class StorageException extends ApiException {

    public StorageException(String message) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, "evidence-storage-failure", message);
    }
}
