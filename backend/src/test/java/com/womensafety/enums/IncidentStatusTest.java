package com.womensafety.enums;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IncidentStatusTest {

    @Test
    @DisplayName("Forward lifecycle transitions are allowed")
    void forwardTransitions() {
        assertThat(IncidentStatus.SUBMITTED.canTransitionTo(IncidentStatus.UNDER_REVIEW)).isTrue();
        assertThat(IncidentStatus.UNDER_REVIEW.canTransitionTo(IncidentStatus.ASSIGNED)).isTrue();
        assertThat(IncidentStatus.ASSIGNED.canTransitionTo(IncidentStatus.IN_PROGRESS)).isTrue();
        assertThat(IncidentStatus.IN_PROGRESS.canTransitionTo(IncidentStatus.RESOLVED)).isTrue();
        assertThat(IncidentStatus.RESOLVED.canTransitionTo(IncidentStatus.CLOSED)).isTrue();
    }

    @Test
    @DisplayName("Skipping stages and reopening closed cases is rejected")
    void illegalTransitions() {
        assertThat(IncidentStatus.SUBMITTED.canTransitionTo(IncidentStatus.RESOLVED)).isFalse();
        assertThat(IncidentStatus.SUBMITTED.canTransitionTo(IncidentStatus.CLOSED)).isFalse();
        assertThat(IncidentStatus.CLOSED.canTransitionTo(IncidentStatus.UNDER_REVIEW)).isFalse();
        assertThat(IncidentStatus.CLOSED.allowedTargets()).isEmpty();
    }
}
