package com.womensafety.service;

import com.womensafety.dto.AdminDtos;
import com.womensafety.dto.IncidentDtos;
import com.womensafety.dto.IncidentSearchCriteria;
import com.womensafety.entity.EvidenceMetadata;
import com.womensafety.entity.Incident;
import com.womensafety.entity.IncidentStatusHistory;
import com.womensafety.entity.Responder;
import com.womensafety.entity.User;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.exception.ApiException;
import com.womensafety.exception.IncidentNotFoundException;
import com.womensafety.exception.InvalidReportException;
import com.womensafety.exception.InvalidStatusTransitionException;
import com.womensafety.exception.ResponderNotFoundException;
import com.womensafety.repository.EvidenceRepository;
import com.womensafety.repository.IncidentNoteRepository;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.IncidentStatusHistoryRepository;
import com.womensafety.repository.ResponderRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.security.UserPrincipal;
import jakarta.persistence.criteria.Predicate;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Administration use cases for the incident queue: search, triage, assignment and notes. */
@Service
public class IncidentAdminService {

    private final IncidentRepository incidentRepository;
    private final ResponderRepository responderRepository;
    private final UserRepository userRepository;
    private final EvidenceRepository evidenceRepository;
    private final IncidentStatusHistoryRepository historyRepository;
    private final IncidentNoteRepository noteRepository;
    private final IncidentService incidentService;
    private final IncidentAccessPolicy accessPolicy;
    private final EvidenceStorageService evidenceStorageService;
    private final AlertService alertService;
    private final AuditService auditService;
    private final IncidentMapper mapper;

    public IncidentAdminService(IncidentRepository incidentRepository, ResponderRepository responderRepository,
                                UserRepository userRepository, EvidenceRepository evidenceRepository,
                                IncidentStatusHistoryRepository historyRepository,
                                IncidentNoteRepository noteRepository, IncidentService incidentService,
                                IncidentAccessPolicy accessPolicy, EvidenceStorageService evidenceStorageService,
                                AlertService alertService, AuditService auditService, IncidentMapper mapper) {
        this.incidentRepository = incidentRepository;
        this.responderRepository = responderRepository;
        this.userRepository = userRepository;
        this.evidenceRepository = evidenceRepository;
        this.historyRepository = historyRepository;
        this.noteRepository = noteRepository;
        this.incidentService = incidentService;
        this.accessPolicy = accessPolicy;
        this.evidenceStorageService = evidenceStorageService;
        this.alertService = alertService;
        this.auditService = auditService;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<IncidentDtos.IncidentSummary> search(IncidentSearchCriteria criteria) {
        Specification<Incident> specification = buildSpecification(criteria);
        Page<Incident> page = incidentRepository.findAll(specification,
                PageRequest.of(criteria.page(), criteria.size(), buildSort(criteria)));
        return AdminDtos.PageResponse.of(page.map(mapper::summary));
    }

    @Transactional(readOnly = true)
    public IncidentDtos.IncidentDetail detail(Long id, UserPrincipal principal) {
        Incident incident = incidentService.requireIncident(id);
        accessPolicy.assertStaffCanView(incident, principal);
        return incidentService.detailFor(incident, true);
    }

    @Transactional
    public IncidentDtos.IncidentDetail updateStatus(Long id, AdminDtos.StatusUpdateRequest request,
                                                    UserPrincipal principal) {
        Incident incident = incidentService.requireIncident(id);
        IncidentStatus from = incident.getStatus();
        IncidentStatus target = request.status();
        if (from == target) {
            throw new InvalidStatusTransitionException(from, target);
        }
        if (!from.canTransitionTo(target)) {
            throw new InvalidStatusTransitionException(from, target);
        }
        if (target == IncidentStatus.RESOLVED
                && (request.note() == null || request.note().trim().length() < 10)) {
            throw new InvalidReportException(
                    "A resolution note of at least 10 characters is required to mark a case resolved.");
        }
        String note = request.note() == null ? null : request.note().trim();
        incident.updateStatus(target, target == IncidentStatus.RESOLVED ? note : null);
        incidentRepository.save(incident);

        User actor = userRepository.findById(principal.getId()).orElse(null);
        historyRepository.save(IncidentStatusHistory.record(incident, from, target, actor,
                principal.getDisplayName(), note));
        alertService.raiseStatusChanged(incident, "Updated by the safety desk.");
        auditService.record("INCIDENT_STATUS_CHANGED", "Incident", incident.getReportId(),
                from + " -> " + target);
        return incidentService.detailFor(incident, true);
    }

    @Transactional
    public IncidentDtos.IncidentDetail assign(Long id, AdminDtos.AssignResponderRequest request,
                                              UserPrincipal principal) {
        Incident incident = incidentService.requireIncident(id);
        Responder responder = responderRepository.findById(request.responderId())
                .orElseThrow(() -> new ResponderNotFoundException(request.responderId()));
        if (responder.getAvailability() == com.womensafety.enums.ResponderAvailability.UNAVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "responder-unavailable",
                    "This responder is marked unavailable and cannot receive new cases.") {
            };
        }
        IncidentStatus from = incident.getStatus();
        incident.assignTo(responder);
        incidentRepository.save(incident);

        User actor = userRepository.findById(principal.getId()).orElse(null);
        historyRepository.save(IncidentStatusHistory.record(incident, from, incident.getStatus(), actor,
                principal.getDisplayName(),
                "Assigned to " + responder.getDisplayName() + " (" + responder.getBadgeCode() + ")."));
        alertService.raiseAssignment(incident);
        auditService.record("INCIDENT_ASSIGNED", "Incident", incident.getReportId(),
                "Responder " + responder.getBadgeCode());
        return incidentService.detailFor(incident, true);
    }

    @Transactional
    public IncidentDtos.IncidentDetail escalate(Long id, AdminDtos.EscalateRequest request,
                                                UserPrincipal principal) {
        Incident incident = incidentService.requireIncident(id);
        incident.escalate(request.reason().trim());
        incidentRepository.save(incident);

        User actor = userRepository.findById(principal.getId()).orElse(null);
        historyRepository.save(IncidentStatusHistory.record(incident, incident.getStatus(),
                incident.getStatus(), actor, principal.getDisplayName(),
                "Manually escalated to CRITICAL: " + request.reason().trim()));
        alertService.raiseEscalated(incident);
        auditService.record("INCIDENT_ESCALATED", "Incident", incident.getReportId(),
                "Manual priority override to CRITICAL");
        return incidentService.detailFor(incident, true);
    }

    @Transactional
    public IncidentDtos.IncidentDetail addNote(Long id, AdminDtos.AddNoteRequest request,
                                               UserPrincipal principal) {
        Incident incident = incidentService.requireIncident(id);
        User author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "unauthenticated",
                        "The signed-in account no longer exists.") {
                });
        noteRepository.save(com.womensafety.entity.IncidentNote.create(incident, author, request.note().trim()));
        auditService.record("INCIDENT_NOTE_ADDED", "Incident", incident.getReportId(), "Internal note added");
        return incidentService.detailFor(incident, true);
    }

    @Transactional(readOnly = true)
    public EvidenceDownload downloadEvidence(Long incidentId, Long evidenceId, UserPrincipal principal) {
        Incident incident = incidentService.requireIncident(incidentId);
        accessPolicy.assertStaffCanView(incident, principal);
        EvidenceMetadata metadata = evidenceRepository.findByIdAndIncidentId(evidenceId, incidentId)
                .orElseThrow(() -> new IncidentNotFoundException(String.valueOf(evidenceId)));
        Resource resource = evidenceStorageService.load(metadata.getStoredFilename());
        return new EvidenceDownload(resource, metadata.getOriginalFilename(), metadata.getContentType());
    }

    @Transactional
    public IncidentDtos.IncidentDetail updateStatusAsResponder(Long id, AdminDtos.StatusUpdateRequest request,
                                                               UserPrincipal principal) {
        Incident incident = incidentService.requireIncident(id);
        if (!accessPolicy.isAssignedResponder(incident, principal)) {
            throw new com.womensafety.exception.UnauthorizedIncidentAccessException();
        }
        return updateStatus(id, request, principal);
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<IncidentDtos.IncidentSummary> assignedTo(Long responderId, int page, int size) {
        Page<Incident> result = incidentRepository.findByResponderIdOrderBySubmittedAtDesc(responderId,
                PageRequest.of(Math.max(0, page), size <= 0 ? 20 : Math.min(size, 100)));
        return AdminDtos.PageResponse.of(result.map(mapper::summary));
    }

    private Specification<Incident> buildSpecification(IncidentSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (criteria.query() != null && !criteria.query().isBlank()) {
                String needle = "%" + criteria.query().trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("reportId")), needle),
                        cb.like(cb.lower(root.get("zoneName")), needle),
                        cb.like(cb.lower(root.get("description")), needle)));
            }
            if (criteria.type() != null) {
                predicates.add(cb.equal(root.get("incidentType"), criteria.type()));
            }
            if (criteria.priority() != null) {
                predicates.add(cb.equal(root.get("priority"), criteria.priority()));
            }
            if (criteria.status() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.status()));
            }
            if (criteria.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("submittedAt"), criteria.from()));
            }
            if (criteria.to() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("submittedAt"), criteria.to()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort buildSort(IncidentSearchCriteria criteria) {
        Sort.Direction direction = "asc".equalsIgnoreCase(criteria.direction())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return switch (criteria.sort()) {
            case "created" -> Sort.by(direction, "submittedAt");
            case "updated" -> Sort.by(direction, "updatedAt");
            default -> Sort.by(Sort.Order.desc("severityScore"), Sort.Order.desc("submittedAt"));
        };
    }

    /** Evidence bytes plus the metadata needed to set response headers. */
    public record EvidenceDownload(Resource resource, String filename, String contentType) {
    }
}
