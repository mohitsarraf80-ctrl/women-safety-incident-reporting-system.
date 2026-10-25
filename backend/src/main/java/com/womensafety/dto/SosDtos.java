package com.womensafety.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/** SOS activation payloads. */
public final class SosDtos {

    private SosDtos() {
    }

    public record SosRequest(
            @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
            @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
            Double latitude,

            @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
            @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
            Double longitude,

            @Size(max = 160)
            String zoneName,

            @Size(max = 1000)
            String description
    ) {
    }

    public record SosResponse(
            String referenceId,
            String reportId,
            String trackingCode,
            Instant activatedAt,
            String status,
            String priority,
            int severityScore,
            boolean locationCaptured,
            String locationNote,
            String notificationStatus,
            String notificationDetail,
            List<String> alerts,
            String disclaimer
    ) {
    }
}
