package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;

import java.time.Instant;

/**
 * Everything the severity engine needs for one incident. The repeat count is supplied
 * by the caller so that the scoring code stays free of database access and is trivially
 * unit-testable.
 *
 * @param previousReportsInZone number of eligible earlier reports in the same zone
 */
public record SeverityInput(
        IncidentType type,
        Instant occurredAt,
        boolean evidenceAttached,
        boolean sosTriggered,
        int previousReportsInZone
) {
    public SeverityInput {
        if (type == null) {
            throw new IllegalArgumentException("Incident type is required for severity scoring");
        }
        if (occurredAt == null) {
            throw new IllegalArgumentException("Incident time is required for severity scoring");
        }
        if (previousReportsInZone < 0) {
            previousReportsInZone = 0;
        }
    }
}
