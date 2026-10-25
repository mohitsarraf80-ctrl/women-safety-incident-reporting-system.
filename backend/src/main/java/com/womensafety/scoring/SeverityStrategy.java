package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;

/**
 * Strategy contract for the severity engine. One implementation exists per incident
 * category, which is where the original class-diagram's per-subtype
 * {@code calculateSeverity()} method lives in this codebase.
 */
public interface SeverityStrategy {

    IncidentType supports();

    SeverityResult score(SeverityInput input);
}
