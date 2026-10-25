package com.womensafety.service;

import com.womensafety.dto.SosDtos;
import com.womensafety.entity.Incident;
import com.womensafety.entity.IncidentStatusHistory;
import com.womensafety.entity.User;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
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

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Simulated SOS workflow. An activation always creates a real incident row, a tracking
 * credential and an urgent alert in the administrator feed. No external message is sent:
 * the response says SIMULATED explicitly.
 */
@Service
public class SosService {

    private static final Logger log = LoggerFactory.getLogger(SosService.class);
    private static final Duration REPEAT_WINDOW = Duration.ofDays(30);
    private static final String DEFAULT_DESCRIPTION =
            "SOS activation from the web application. The reporter pressed the emergency button.";

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final IncidentStatusHistoryRepository historyRepository;
    private final SeverityScoringService scoringService;
    private final AlertService alertService;
    private final AuditService auditService;
    private final ReportIdAllocator reportIdAllocator;
    private final ReportIdGenerator idGenerator;
    private final GridProjection gridProjection;
    private final PasswordEncoder passwordEncoder;

    public SosService(IncidentRepository incidentRepository, UserRepository userRepository,
                      IncidentStatusHistoryRepository historyRepository,
                      SeverityScoringService scoringService, AlertService alertService,
                      AuditService auditService, ReportIdAllocator reportIdAllocator,
                      ReportIdGenerator idGenerator, GridProjection gridProjection,
                      PasswordEncoder passwordEncoder) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.scoringService = scoringService;
        this.alertService = alertService;
        this.auditService = auditService;
        this.reportIdAllocator = reportIdAllocator;
        this.idGenerator = idGenerator;
        this.gridProjection = gridProjection;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public SosDtos.SosResponse activate(SosDtos.SosRequest request, UserPrincipal principal) {
        boolean hasLocation = request.latitude() != null && request.longitude() != null;
        String zoneName = request.zoneName() == null || request.zoneName().isBlank()
                ? null : request.zoneName().trim();
        String gridCell = hasLocation ? gridProjection.keyFor(request.latitude(), request.longitude()) : null;
        String description = request.description() == null || request.description().isBlank()
                ? DEFAULT_DESCRIPTION : request.description().trim();
        if (description.length() > 4000) {
            description = description.substring(0, 4000);
        }

        User reporter = principal == null ? null : userRepository.findById(principal.getId()).orElse(null);
        Instant now = Instant.now();
        int previousReports = gridCell == null ? 0
                : (int) incidentRepository.countRecentReportsInCell(gridCell, 0L, now.minus(REPEAT_WINDOW));

        SeverityResult severity = scoringService.score(
                new SeverityInput(IncidentType.OTHER, now, false, true, previousReports));

        String reportId = reportIdAllocator.allocateReportId();
        String trackingCode = idGenerator.newTrackingCode();

        Incident incident = Incident.create(reportId,
                passwordEncoder.encode(IncidentService.normalizeTrackingCode(trackingCode)),
                IncidentType.OTHER, description, now, zoneName,
                hasLocation ? request.latitude() : null,
                hasLocation ? request.longitude() : null,
                gridCell, reporter == null, reporter);
        incident.markSos();
        incident.applySeverity(severity.score(), severity.priority(), severity.baseScore(),
                severity.nightBonus(), severity.repeatBonus(), severity.evidenceBonus(), severity.sosBonus());
        incidentRepository.save(incident);

        historyRepository.save(IncidentStatusHistory.record(incident, null, IncidentStatus.SUBMITTED,
                reporter, reporter == null ? "Anonymous reporter" : reporter.getDisplayName(),
                "SOS activated. Priority " + severity.priority() + " (" + severity.score() + "/100)."));

        int alerts = alertService.raiseSos(incident);
        auditService.record("SOS_ACTIVATED", "Incident", reportId,
                "SOS recorded, location captured=" + hasLocation);

        String reference = idGenerator.newSosReference();
        log.info("SOS {} recorded as incident {} (alerts: {})", reference, reportId, alerts);

        String locationNote = hasLocation
                ? "GPS coordinates were recorded with the alert."
                : "No GPS coordinates were available. The alert is recorded without a precise location; "
                + "location access is optional so that help can still be requested.";

        return new SosDtos.SosResponse(reference, reportId, trackingCode, now,
                incident.getStatus().name(), incident.getPriority().name(), incident.getSeverityScore(),
                hasLocation, locationNote, "SIMULATED",
                "An in-app alert is visible to administrators now. SMS and e-mail delivery are simulated in "
                        + "this prototype; no real message was sent and no emergency service was contacted.",
                List.of("Administrator in-app feed: created",
                        "On-call safety desk SMS: SIMULATED"),
                "DEMO MODE - this is a college prototype, not an emergency service. For immediate danger, "
                        + "contact local emergency services.");
    }
}
