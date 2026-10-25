package com.womensafety.dto;

import java.time.Instant;
import java.util.List;

/** Analytics chart payloads. Every value is aggregated from the database. */
public final class AnalyticsDtos {

    private AnalyticsDtos() {
    }

    public record CountItem(String key, String label, long count) {
    }

    public record TimeSeriesPoint(String date, long count) {
    }

    public record ResponderWorkload(String responder, long activeAssignments, long totalAssignments) {
    }

    public record Overview(
            long totalIncidents,
            long resolvedIncidents,
            long pendingIncidents,
            long sosIncidents,
            long criticalIncidents,
            double averageResolutionHours,
            long resolvedSamples,
            Instant from,
            Instant to
    ) {
    }

    public record Charts(
            List<CountItem> byCategory,
            List<CountItem> byPriority,
            List<CountItem> byStatus,
            List<TimeSeriesPoint> overTime,
            List<ResponderWorkload> responderWorkload,
            long resolved,
            long pending,
            long sos,
            Instant from,
            Instant to
    ) {
    }

    public record ResponseTimes(
            double averageResolutionHours,
            double medianResolutionHours,
            long resolvedSamples,
            List<CountItem> byPriority,
            Instant from,
            Instant to
    ) {
    }
}
