package com.womensafety.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Case lifecycle of an incident. Allowed transitions are enforced in the backend so
 * that a client cannot move a case backwards or skip the required review steps.
 */
public enum IncidentStatus {

    SUBMITTED("Submitted"),
    UNDER_REVIEW("Under review"),
    ASSIGNED("Assigned"),
    IN_PROGRESS("In progress"),
    RESOLVED("Resolved"),
    CLOSED("Closed");

    private static final Map<IncidentStatus, Set<IncidentStatus>> ALLOWED = Map.of(
            SUBMITTED, EnumSet.of(UNDER_REVIEW, ASSIGNED),
            UNDER_REVIEW, EnumSet.of(ASSIGNED, IN_PROGRESS),
            ASSIGNED, EnumSet.of(IN_PROGRESS, UNDER_REVIEW),
            IN_PROGRESS, EnumSet.of(RESOLVED, UNDER_REVIEW),
            RESOLVED, EnumSet.of(CLOSED, IN_PROGRESS),
            CLOSED, EnumSet.noneOf(IncidentStatus.class)
    );

    private final String label;

    IncidentStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /** @return true when an administrator/responder may move a case from {@code this} to {@code target}. */
    public boolean canTransitionTo(IncidentStatus target) {
        return target != null && ALLOWED.get(this).contains(target);
    }

    public Set<IncidentStatus> allowedTargets() {
        return Set.copyOf(ALLOWED.get(this));
    }

    public boolean isTerminal() {
        return this == CLOSED;
    }
}
