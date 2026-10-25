package com.womensafety.service;

import com.womensafety.dto.AdminDtos;
import com.womensafety.dto.IncidentDtos;
import com.womensafety.entity.Alert;
import com.womensafety.entity.EvidenceMetadata;
import com.womensafety.entity.Incident;
import com.womensafety.entity.IncidentNote;
import com.womensafety.entity.IncidentStatusHistory;
import com.womensafety.entity.Responder;
import com.womensafety.enums.IncidentStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

/**
 * Maps JPA entities to API DTOs. Controllers never return entities directly, which keeps
 * lazy-loading and JSON-serialisation problems out of the API surface.
 */
@Component
public class IncidentMapper {

    public IncidentDtos.IncidentSummary summary(Incident incident) {
        Responder responder = incident.getResponder();
        return new IncidentDtos.IncidentSummary(
                incident.getId(),
                incident.getReportId(),
                incident.getIncidentType(),
                incident.getIncidentType().getLabel(),
                incident.getZoneName(),
                incident.getOccurredAt(),
                incident.getSubmittedAt(),
                incident.getSeverityScore(),
                incident.getPriority(),
                incident.getPriority().getLabel(),
                incident.getStatus(),
                incident.getStatus().getLabel(),
                incident.isAnonymous(),
                incident.isSosTriggered(),
                responder == null ? null : responder.getDisplayName(),
                incident.isEscalated(),
                incident.getUpdatedAt());
    }

    public IncidentDtos.IncidentDetail detail(Incident incident,
                                              List<EvidenceMetadata> evidence,
                                              List<IncidentStatusHistory> history,
                                              List<IncidentNote> notes,
                                              List<Alert> alerts,
                                              boolean revealCoordinates) {
        IncidentDtos.SeverityBreakdown breakdown = new IncidentDtos.SeverityBreakdown(
                incident.getBaseScore(), incident.getNightBonus(), incident.getRepeatBonus(),
                incident.getEvidenceBonus(), incident.getSosBonus(), incident.getSeverityScore(),
                incident.getPriority(),
                "min(100, " + incident.getBaseScore() + " + " + incident.getNightBonus() + " + "
                        + incident.getRepeatBonus() + " + " + incident.getEvidenceBonus() + " + "
                        + incident.getSosBonus() + ")");

        IncidentDtos.ContactDetails contact = incident.isAnonymous() ? null
                : new IncidentDtos.ContactDetails(incident.getContactName(), incident.getContactEmail(),
                incident.getContactPhone());

        IncidentDtos.ReporterInfo reporter = incident.getReporter() == null ? null
                : new IncidentDtos.ReporterInfo(incident.getReporter().getId(),
                incident.getReporter().getDisplayName());

        Responder responder = incident.getResponder();
        IncidentDtos.ResponderSummary responderSummary = responder == null ? null
                : new IncidentDtos.ResponderSummary(responder.getId(), responder.getBadgeCode(),
                responder.getDisplayName(), responder.getOrganisation(),
                responder.getAvailability().name());

        Set<IncidentStatus> next = incident.getStatus().allowedTargets();

        return new IncidentDtos.IncidentDetail(
                incident.getId(),
                incident.getReportId(),
                incident.getIncidentType(),
                incident.getIncidentType().getLabel(),
                incident.getDescription(),
                incident.getOccurredAt(),
                incident.getSubmittedAt(),
                revealCoordinates ? incident.getLatitude() : null,
                revealCoordinates ? incident.getLongitude() : null,
                incident.getZoneName(),
                incident.getGridCell(),
                incident.getSeverityScore(),
                incident.getPriority(),
                incident.getPriority().getLabel(),
                incident.getStatus(),
                incident.getStatus().getLabel(),
                incident.isAnonymous(),
                incident.isSosTriggered(),
                incident.isRequiresImmediateAssistance(),
                incident.isEscalated(),
                incident.getEscalationReason(),
                incident.getResolutionNote(),
                incident.getResolvedAt(),
                incident.getUpdatedAt(),
                breakdown,
                contact,
                reporter,
                responderSummary,
                evidence.stream().map(this::evidence).toList(),
                history.stream().map(this::history).toList(),
                notes.stream().map(this::note).toList(),
                alerts.stream().map(this::alert).toList(),
                next);
    }

    public IncidentDtos.EvidenceItem evidence(EvidenceMetadata metadata) {
        return new IncidentDtos.EvidenceItem(metadata.getId(), metadata.getOriginalFilename(),
                metadata.getContentType(), metadata.getSizeBytes(), metadata.getUploadedAt(),
                "/api/evidence/" + metadata.getIncident().getId() + "/" + metadata.getId());
    }

    public IncidentDtos.HistoryItem history(IncidentStatusHistory row) {
        return new IncidentDtos.HistoryItem(row.getToStatus(), row.getToStatus().getLabel(),
                row.getChangedAt(), row.getNote(), row.getActorLabel());
    }

    public IncidentDtos.NoteItem note(IncidentNote row) {
        return new IncidentDtos.NoteItem(row.getId(), row.getAuthor().getDisplayName(), row.getBody(),
                row.getCreatedAt());
    }

    public IncidentDtos.AlertItem alert(Alert alert) {
        return new IncidentDtos.AlertItem(alert.getId(), alert.getAlertType().name(),
                alert.getRecipientCategory().name(), alert.getChannel().name(), alert.getRecipientRef(),
                alert.getMessage(), alert.getStatus().name(), alert.getErrorDetail(), alert.getAttempts(),
                alert.getCreatedAt(), alert.getSentAt());
    }

    public AdminDtos.AlertResponse alertResponse(Alert alert) {
        return new AdminDtos.AlertResponse(alert.getId(), alert.getIncident().getId(),
                alert.getIncident().getReportId(), alert.getAlertType(), alert.getRecipientCategory(),
                alert.getChannel(), alert.getRecipientRef(), alert.getMessage(), alert.getStatus(),
                alert.getErrorDetail(), alert.getAttempts(), alert.getCreatedAt(), alert.getSentAt());
    }

    public IncidentDtos.TrackingResponse tracking(Incident incident, List<IncidentStatusHistory> history,
                                                  String privacyNote) {
        return new IncidentDtos.TrackingResponse(
                incident.getReportId(),
                incident.getIncidentType(),
                incident.getIncidentType().getLabel(),
                incident.getStatus(),
                incident.getStatus().getLabel(),
                incident.getPriority(),
                incident.getPriority().getLabel(),
                incident.getSubmittedAt(),
                incident.getOccurredAt(),
                incident.getZoneName(),
                incident.isAnonymous(),
                history.stream()
                        .map(row -> new IncidentDtos.TrackingEvent(row.getToStatus(),
                                row.getToStatus().getLabel(), row.getChangedAt(), row.getNote()))
                        .toList(),
                privacyNote);
    }
}
