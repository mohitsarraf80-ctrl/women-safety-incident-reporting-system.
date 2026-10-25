package com.womensafety.service;

import com.womensafety.dto.IncidentDtos;
import com.womensafety.entity.EvidenceMetadata;
import com.womensafety.entity.Incident;
import com.womensafety.entity.IncidentStatusHistory;
import com.womensafety.entity.User;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.exception.IncidentNotFoundException;
import com.womensafety.exception.InvalidReportException;
import com.womensafety.exception.UnauthorizedIncidentAccessException;
import com.womensafety.repository.EvidenceRepository;
import com.womensafety.repository.IncidentNoteRepository;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.IncidentStatusHistoryRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.scoring.SeverityInput;
import com.womensafety.scoring.SeverityResult;
import com.womensafety.scoring.SeverityScoringService;
import com.womensafety.security.UserPrincipal;
import com.womensafety.util.GridProjection;
import com.womensafety.util.ReportIdGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

/**
 * Core reporting workflow: validation, severity scoring, Report ID generation, evidence
 * handling, status history and alert creation. All steps run in one transaction so a
 * failure cannot leave a half-created report behind.
 */
@Service
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    /** Repeat-report window: earlier reports submitted in the last 30 days. */
    private static final Duration REPEAT_WINDOW = Duration.ofDays(30);

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final EvidenceRepository evidenceRepository;
    private final IncidentStatusHistoryRepository historyRepository;
    private final IncidentNoteRepository noteRepository;
    private final EvidenceStorageService evidenceStorageService;
    private final SeverityScoringService scoringService;
    private final AlertService alertService;
    private final AuditService auditService;
    private final IncidentAccessPolicy accessPolicy;
    private final IncidentMapper mapper;
    private final ReportIdGenerator idGenerator;
    private final ReportIdAllocator reportIdAllocator;
    private final GridProjection gridProjection;
    private final PasswordEncoder passwordEncoder;

    public IncidentService(IncidentRepository incidentRepository,
                           UserRepository userRepository,
                           EvidenceRepository evidenceRepository,
                           IncidentStatusHistoryRepository historyRepository,
                           IncidentNoteRepository noteRepository,
                           EvidenceStorageService evidenceStorageService,
                           SeverityScoringService scoringService,
                           AlertService alertService,
                           AuditService auditService,
                           IncidentAccessPolicy accessPolicy,
                           IncidentMapper mapper,
                           ReportIdGenerator idGenerator,
                           ReportIdAllocator reportIdAllocator,
                           GridProjection gridProjection,
                           PasswordEncoder passwordEncoder) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.evidenceRepository = evidenceRepository;
        this.historyRepository = historyRepository;
        this.noteRepository = noteRepository;
        this.evidenceStorageService = evidenceStorageService;
        this.scoringService = scoringService;
        this.alertService = alertService;
        this.auditService = auditService;
        this.accessPolicy = accessPolicy;
        this.mapper = mapper;
        this.idGenerator = idGenerator;
        this.reportIdAllocator = reportIdAllocator;
        this.gridProjection = gridProjection;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public IncidentDtos.CreatedResponse submit(IncidentDtos.CreateRequest request, MultipartFile evidenceFile,
                                               UserPrincipal principal) {
        boolean anonymous = request.anonymous();
        User reporter = null;
        if (!anonymous && principal != null) {
            reporter = userRepository.findById(principal.getId()).orElse(null);
        }
        if (anonymous) {
            reporter = null;
        }
        if (!anonymous && reporter == null && isBlank(request.contactName())
                && isBlank(request.contactEmail()) && isBlank(request.contactPhone())) {
            throw new InvalidReportException(
                    "For a non-anonymous report without an account, provide at least one contact method "
                            + "or choose anonymous reporting.");
        }

        boolean hasLatitude = request.latitude() != null;
        boolean hasLongitude = request.longitude() != null;
        if (hasLatitude != hasLongitude) {
            throw new InvalidReportException("Provide both latitude and longitude, or neither.");
        }
        String zoneName = isBlank(request.zoneName()) ? null : request.zoneName().trim();
        if (!hasLatitude && zoneName == null) {
            throw new InvalidReportException("Provide a location: either a zone description or coordinates.");
        }
        String gridCell = hasLatitude ? gridProjection.keyFor(request.latitude(), request.longitude()) : null;
        if (!hasLatitude && zoneName != null) {
            zoneName = zoneName.length() > 160 ? zoneName.substring(0, 160) : zoneName;
        }

        boolean hasEvidence = evidenceFile != null && !evidenceFile.isEmpty();
        int previousReports = countPreviousReports(gridCell, zoneName);
        SeverityResult severity = scoringService.score(new SeverityInput(request.type(), request.occurredAt(),
                hasEvidence, false, previousReports));

        String reportId = uniqueReportId();
        String trackingCode = idGenerator.newTrackingCode();
        String trackingNormalized = normalizeTrackingCode(trackingCode);

        Incident incident = Incident.create(reportId, passwordEncoder.encode(trackingNormalized),
                request.type(), request.description().trim(), request.occurredAt(), zoneName,
                hasLatitude ? request.latitude() : null,
                hasLongitude ? request.longitude() : null,
                gridCell, anonymous, reporter);
        incident.applySeverity(severity.score(), severity.priority(), severity.baseScore(),
                severity.nightBonus(), severity.repeatBonus(), severity.evidenceBonus(), severity.sosBonus());
        incident.requestImmediateAssistance(request.requiresImmediateAssistance());
        if (!anonymous) {
            incident.attachContactDetails(trimToNull(request.contactName()), trimToNull(request.contactEmail()),
                    trimToNull(request.contactPhone()));
        }
        incidentRepository.save(incident);

        String storedFilename = null;
        try {
            if (hasEvidence) {
                EvidenceStorageService.StoredEvidence stored =
                        evidenceStorageService.store(reportId, evidenceFile);
                storedFilename = stored.storedFilename();
                evidenceRepository.save(EvidenceMetadata.create(incident, stored.storedFilename(),
                        stored.originalFilename(), stored.contentType(), stored.sizeBytes(), stored.sha256()));
            }
            String actorLabel = reporter != null ? reporter.getDisplayName() : "Anonymous reporter";
            historyRepository.save(IncidentStatusHistory.record(incident, null, IncidentStatus.SUBMITTED,
                    reporter, actorLabel,
                    "Report submitted. Priority " + severity.priority() + " (" + severity.score() + "/100)."));
            int alerts = alertService.raiseIncidentCreated(incident);
            auditService.record("INCIDENT_SUBMITTED", "Incident", reportId,
                    "Category " + request.type() + ", priority " + severity.priority()
                            + ", anonymous " + anonymous);
            log.info("Incident {} recorded with priority {} (score {})", reportId, severity.priority(),
                    severity.score());

            return new IncidentDtos.CreatedResponse(reportId, trackingCode, incident.getStatus(),
                    incident.getStatus().getLabel(), incident.getPriority(), incident.getPriority().getLabel(),
                    incident.getSeverityScore(), incident.getSubmittedAt(), anonymous, hasEvidence, alerts,
                    "Save this Report ID and tracking code. The tracking code is shown only once.",
                    "This prototype is not an emergency service. For immediate danger contact local "
                            + "emergency services directly.");
        } catch (RuntimeException ex) {
            if (storedFilename != null) {
                evidenceStorageService.delete(storedFilename);
            }
            throw ex;
        }
    }

    @Transactional
    public IncidentDtos.EvidenceUploadResponse addEvidence(String reportId, String trackingCode,
                                                           MultipartFile file, UserPrincipal principal) {
        Incident incident = incidentRepository.findByReportId(normalizeReportId(reportId))
                .orElseThrow(() -> new IncidentNotFoundException(reportId));
        accessPolicy.assertCanAttachEvidence(incident, principal, trackingCode);
        if (file == null || file.isEmpty()) {
            throw new InvalidReportException("Choose a file to upload.");
        }
        EvidenceStorageService.StoredEvidence stored = evidenceStorageService.store(incident.getReportId(), file);
        evidenceRepository.save(EvidenceMetadata.create(incident, stored.storedFilename(),
                stored.originalFilename(), stored.contentType(), stored.sizeBytes(), stored.sha256()));

        int previousReports = incident.getRepeatBonus() / 10;
        SeverityResult severity = scoringService.score(new SeverityInput(incident.getIncidentType(),
                incident.getOccurredAt(), true, incident.isSosTriggered(), previousReports));
        incident.applySeverity(severity.score(), severity.priority(), severity.baseScore(),
                severity.nightBonus(), severity.repeatBonus(), severity.evidenceBonus(), severity.sosBonus());
        incidentRepository.save(incident);
        historyRepository.save(IncidentStatusHistory.record(incident, incident.getStatus(), incident.getStatus(),
                principal == null ? null : userRepository.findById(principal.getId()).orElse(null),
                principal == null ? "Reporter" : principal.getDisplayName(), "Supporting evidence attached."));
        auditService.record("EVIDENCE_ADDED", "Incident", incident.getReportId(), "Evidence metadata stored");
        return new IncidentDtos.EvidenceUploadResponse(incident.getId(), stored.originalFilename(),
                stored.contentType(), stored.sizeBytes(), Instant.now(), incident.getSeverityScore(),
                incident.getPriority());
    }

    @Transactional(readOnly = true)
    public IncidentDtos.IncidentDetail detailForStaff(Long incidentId, UserPrincipal principal) {
        Incident incident = requireIncident(incidentId);
        accessPolicy.assertStaffCanView(incident, principal);
        return detailFor(incident, true);
    }

    @Transactional(readOnly = true)
    public IncidentDtos.IncidentDetail detailForReporter(Long incidentId, UserPrincipal principal) {
        Incident incident = requireIncident(incidentId);
        accessPolicy.assertReporterOwns(incident, principal);
        return detailFor(incident, true);
    }

    @Transactional(readOnly = true)
    public List<IncidentDtos.IncidentSummary> myReports(UserPrincipal principal) {
        return incidentRepository.findByReporterIdOrderBySubmittedAtDesc(principal.getId())
                .stream().map(mapper::summary).toList();
    }

    @Transactional(readOnly = true)
    public Incident requireIncident(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException(String.valueOf(id)));
    }

    public Incident buildDetailEntity(Long id) {
        return requireIncident(id);
    }

    public IncidentDtos.IncidentDetail detailFor(Incident incident, boolean revealCoordinates) {
        return mapper.detail(incident,
                evidenceRepository.findByIncidentIdOrderByUploadedAtAsc(incident.getId()),
                historyRepository.findByIncidentIdOrderByChangedAtAsc(incident.getId()),
                noteRepository.findByIncidentIdOrderByCreatedAtAsc(incident.getId()),
                alertService.forIncident(incident.getId()),
                revealCoordinates);
    }

    private int countPreviousReports(String gridCell, String zoneName) {
        Instant since = Instant.now().minus(REPEAT_WINDOW);
        if (gridCell != null) {
            return (int) Math.min(Integer.MAX_VALUE,
                    incidentRepository.countRecentReportsInCell(gridCell, 0L, since));
        }
        if (zoneName != null) {
            return (int) Math.min(Integer.MAX_VALUE,
                    incidentRepository.countRecentReportsInZoneName(zoneName, 0L, since));
        }
        return 0;
    }

    private String uniqueReportId() {
        return reportIdAllocator.allocateReportId();
    }

    public static String normalizeTrackingCode(String code) {
        if (code == null) {
            return "";
        }
        return code.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    }

    public static String normalizeReportId(String reportId) {
        return reportId == null ? "" : reportId.trim().toUpperCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}

