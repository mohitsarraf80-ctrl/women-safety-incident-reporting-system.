package com.womensafety.exception;

import com.womensafety.enums.IncidentStatus;
import org.springframework.http.HttpStatus;

public class InvalidStatusTransitionException extends ApiException {

    public InvalidStatusTransitionException(IncidentStatus from, IncidentStatus to) {
        super(HttpStatus.CONFLICT, "invalid-status-transition",
                "A case cannot move from " + from + " to " + to + ". Allowed next states: " + from.allowedTargets() + ".");
    }
}
