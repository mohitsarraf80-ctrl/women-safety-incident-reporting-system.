package com.womensafety.dto;

import com.womensafety.enums.AlertStatus;
import com.womensafety.enums.AlertType;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.NotificationChannel;
import com.womensafety.enums.RecipientCategory;
import com.womensafety.enums.ResponderAvailability;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Administration, responder and alert payloads. */
public final class AdminDtos {

    private AdminDtos() {
    }

    public record StatusUpdateRequest(
            @NotNull(message = "Choose the new status")
            IncidentStatus status,

            @Size(max = 1000, message = "Note is too long")
            String note
    ) {
    }

    public record AssignResponderRequest(
            @NotNull(message = "Choose a responder")
            Long responderId
    ) {
    }

    public record EscalateRequest(
            @NotBlank(message = "Give a reason for escalation")
            @Size(max = 500)
            String reason
    ) {
    }

    public record AddNoteRequest(
            @NotBlank(message = "Note cannot be empty")
            @Size(max = 2000)
            String note
    ) {
    }

    public record DashboardSummary(
            long totalIncidents,
            long todayIncidents,
            long pendingIncidents,
            long inProgressIncidents,
            long resolvedIncidents,
            long criticalIncidents,
            long activeSosAlerts,
            long hotspotsDetected,
            long failedAlerts,
            long unassignedActive,
            Map<String, Long> priorityBreakdown,
            Map<String, Long> statusBreakdown,
            Instant generatedAt
    ) {
    }

    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
        public static <T> PageResponse<T> of(org.springframework.data.domain.Page<T> page) {
            return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages());
        }
    }

    public record ResponderCreateRequest(
            @NotBlank(message = "Responder name is required")
            @Size(max = 120)
            String displayName,

            @NotBlank(message = "Organisation is required")
            @Size(max = 160)
            String organisation,

            @Pattern(regexp = "^[0-9+\\-\\s()]{6,30}$", message = "Enter a valid contact number")
            String contactPhone,

            ResponderAvailability availability,

            @Email(message = "Enter a valid login email")
            @Size(max = 160)
            String loginEmail,

            @Size(min = 8, max = 72, message = "Temporary password must be 8-72 characters")
            String loginPassword
    ) {
    }

    public record ResponderUpdateRequest(
            @NotBlank(message = "Responder name is required")
            @Size(max = 120)
            String displayName,

            @NotBlank(message = "Organisation is required")
            @Size(max = 160)
            String organisation,

            @Pattern(regexp = "^[0-9+\\-\\s()]{6,30}$", message = "Enter a valid contact number")
            String contactPhone,

            @NotNull(message = "Availability is required")
            ResponderAvailability availability
    ) {
    }

    public record ResponderResponse(
            Long id,
            String badgeCode,
            String displayName,
            String organisation,
            String contactPhone,
            ResponderAvailability availability,
            String loginEmail,
            long activeAssignments,
            long totalAssignments,
            Instant createdAt
    ) {
    }

    public record AlertResponse(
            Long id,
            Long incidentId,
            String reportId,
            AlertType alertType,
            RecipientCategory recipientCategory,
            NotificationChannel channel,
            String recipientRef,
            String message,
            AlertStatus status,
            String errorDetail,
            int attempts,
            Instant createdAt,
            Instant sentAt
    ) {
    }

    public record AuditEntry(
            Long id,
            String actorEmail,
            String action,
            String entityType,
            String entityId,
            String details,
            Instant createdAt
    ) {
    }
}
