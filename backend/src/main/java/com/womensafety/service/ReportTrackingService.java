package com.womensafety.service;

import com.womensafety.dto.IncidentDtos;
import com.womensafety.entity.Incident;
import com.womensafety.exception.TrackingVerificationException;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.IncidentStatusHistoryRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Verifies an anonymous tracking credential and returns a deliberately limited view of the
 * report. The endpoint never exposes the description, contact details, evidence or exact
 * coordinates, and it answers with the same generic error whether the ID or the code is
 * wrong.
 */
@Service
public class ReportTrackingService {

    private static final String PRIVACY_NOTE =
            "This tracking view intentionally hides the incident description, evidence and exact "
                    + "coordinates. Keep your Report ID and tracking code private: anyone who has both can "
                    + "view this status page.";

    private final IncidentRepository incidentRepository;
    private final IncidentStatusHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;
    private final IncidentMapper mapper;

    public ReportTrackingService(IncidentRepository incidentRepository,
                                 IncidentStatusHistoryRepository historyRepository,
                                 PasswordEncoder passwordEncoder,
                                 IncidentMapper mapper) {
        this.incidentRepository = incidentRepository;
        this.historyRepository = historyRepository;
        this.passwordEncoder = passwordEncoder;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public IncidentDtos.TrackingResponse track(IncidentDtos.TrackingRequest request) {
        Incident incident = incidentRepository.findByReportId(IncidentService.normalizeReportId(request.reportId()))
                .orElseThrow(TrackingVerificationException::new);
        String normalized = IncidentService.normalizeTrackingCode(request.trackingCode());
        if (normalized.isEmpty()
                || !passwordEncoder.matches(normalized, incident.getTrackingCodeHash())) {
            throw new TrackingVerificationException();
        }
        return mapper.tracking(incident,
                historyRepository.findByIncidentIdOrderByChangedAtAsc(incident.getId()),
                PRIVACY_NOTE);
    }
}
