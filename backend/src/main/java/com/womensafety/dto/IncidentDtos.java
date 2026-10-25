package com.womensafety.dto;

import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.enums.PriorityLevel;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/** Incident submission, tracking and detail payloads. */
public final class IncidentDtos {

    private IncidentDtos() {
    }

    public record CreateRequest(
            @NotNull(message = "Choose an incident category")
            IncidentType type,

            @NotBlank(message = "Describe what happened")
            @Size(min = 20, max = 4000, message = "Description must be 20-4000 characters")
            String description,

            @NotNull(message = "Incident date and time are required")
            @PastOrPresent(message = "The incident time cannot be in the future")
            Instant occurredAt,

            @Size(max = 160, message = "Zone description is too long")
            String zoneName,

            @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
            @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
            Double latitude,

            @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
            @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
            Double longitude,

            boolean anonymous,

            @Size(max = 120)
            String contactName,

            @Email(message = "Enter a valid contact email")
            @Size(max = 160)
            String contactEmail,

            @Pattern(regexp = "^[0-9+\\-\\s()]{6,30}$", message = "Enter a valid contact phone number")
            String contactPhone,

            boolean requiresImmediateAssistance
    ) {
    }

    public record CreatedResponse(
            String reportId,
            String trackingCode,
            IncidentStatus status,
            String statusLabel,
            PriorityLevel priority,
            String priorityLabel,
            int severityScore,
            Instant submittedAt,
            boolean anonymous,
            boolean evidenceAttached,
            int alertsCreated,
            String trackingHint,
            String disclaimer
    ) {
    }

    public record IncidentSummary(
            Long id,
            String reportId,
            IncidentType type,
            String typeLabel,
            String zoneName,
            Instant occurredAt,
            Instant submittedAt,
            int severityScore,
            PriorityLevel priority,
            String priorityLabel,
            IncidentStatus status,
            String statusLabel,
            boolean anonymous,
            boolean sosTriggered,
            String responderName,
            boolean escalated,
            Instant updatedAt
    ) {
    }

    public record SeverityBreakdown(
            int baseScore,
            int nightBonus,
            int repeatBonus,
            int evidenceBonus,
            int sosBonus,
            int totalScore,
            PriorityLevel priority,
            String formula
    ) {
    }

    public record ContactDetails(String name, String email, String phone) {
    }

    public record ReporterInfo(Long id, String displayName) {
    }

    public record ResponderSummary(Long id, String badgeCode, String displayName, String organisation,
                                   String availability) {
    }

    public record EvidenceItem(
            Long id,
            String originalFilename,
            String contentType,
            long sizeBytes,
            Instant uploadedAt,
            String downloadUrl
    ) {
    }

    public record HistoryItem(
            IncidentStatus status,
            String statusLabel,
            Instant changedAt,
            String note,
            String actorLabel
    ) {
    }

    public record NoteItem(
            Long id,
            String author,
            String body,
            Instant createdAt
    ) {
    }

    public record AlertItem(
            Long id,
            String alertType,
            String recipientCategory,
            String channel,
            String recipientRef,
            String message,
            String status,
            String errorDetail,
            int attempts,
            Instant createdAt,
            Instant sentAt
    ) {
    }

    public record IncidentDetail(
            Long id,
            String reportId,
            IncidentType type,
            String typeLabel,
            String description,
            Instant occurredAt,
            Instant submittedAt,
            Double latitude,
            Double longitude,
            String zoneName,
            String gridCell,
            int severityScore,
            PriorityLevel priority,
            String priorityLabel,
            IncidentStatus status,
            String statusLabel,
            boolean anonymous,
            boolean sosTriggered,
            boolean requiresImmediateAssistance,
            boolean escalated,
            String escalationReason,
            String resolutionNote,
            Instant resolvedAt,
            Instant updatedAt,
            SeverityBreakdown severity,
            ContactDetails contact,
            ReporterInfo reporter,
            ResponderSummary responder,
            List<EvidenceItem> evidence,
            List<HistoryItem> history,
            List<NoteItem> notes,
            List<AlertItem> alerts,
            Set<IncidentStatus> allowedNextStatuses
    ) {
    }

    public record TrackingRequest(
            @NotBlank(message = "Report ID is required")
            @Size(max = 20)
            String reportId,

            @NotBlank(message = "Tracking code is required")
            @Size(max = 40)
            String trackingCode
    ) {
    }

    public record TrackingEvent(
            IncidentStatus status,
            String statusLabel,
            Instant changedAt,
            String note
    ) {
    }

    public record TrackingResponse(
            String reportId,
            IncidentType type,
            String typeLabel,
            IncidentStatus status,
            String statusLabel,
            PriorityLevel priority,
            String priorityLabel,
            Instant submittedAt,
            Instant occurredAt,
            String zoneName,
            boolean anonymous,
            List<TrackingEvent> history,
            String privacyNote
    ) {
    }

    public record EvidenceUploadResponse(
            Long id,
            String originalFilename,
            String contentType,
            long sizeBytes,
            Instant uploadedAt,
            int severityScore,
            PriorityLevel priority
    ) {
    }
}
