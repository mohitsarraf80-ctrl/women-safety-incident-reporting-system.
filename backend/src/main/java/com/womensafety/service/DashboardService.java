package com.womensafety.service;

import com.womensafety.dto.AdminDtos;
import com.womensafety.enums.AlertStatus;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.PriorityLevel;
import com.womensafety.repository.AlertRepository;
import com.womensafety.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Live dashboard counters. Every value is a database aggregate, never a hardcoded number. */
@Service
public class DashboardService {

    private static final List<IncidentStatus> PENDING =
            List.of(IncidentStatus.SUBMITTED, IncidentStatus.UNDER_REVIEW);
    private static final List<IncidentStatus> IN_PROGRESS =
            List.of(IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS);
    private static final List<IncidentStatus> RESOLVED =
            List.of(IncidentStatus.RESOLVED, IncidentStatus.CLOSED);
    private static final List<IncidentStatus> OPEN =
            List.of(IncidentStatus.SUBMITTED, IncidentStatus.UNDER_REVIEW,
                    IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS);

    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final HotspotDetectionService hotspotDetectionService;
    private final ZoneId displayZone;

    public DashboardService(IncidentRepository incidentRepository, AlertRepository alertRepository,
                            HotspotDetectionService hotspotDetectionService,
                            @Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
        this.hotspotDetectionService = hotspotDetectionService;
        this.displayZone = ZoneId.of(zone);
    }

    @Transactional(readOnly = true)
    public AdminDtos.DashboardSummary summary() {
        Instant startOfToday = LocalDate.now(displayZone).atStartOfDay(displayZone).toInstant();

        Map<String, Long> priorityBreakdown = new LinkedHashMap<>();
        for (PriorityLevel priority : PriorityLevel.values()) {
            priorityBreakdown.put(priority.name(), incidentRepository.countByPriority(priority));
        }
        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        for (IncidentStatus status : IncidentStatus.values()) {
            statusBreakdown.put(status.name(), incidentRepository.countByStatus(status));
        }

        long hotspotCount;
        try {
            hotspotCount = hotspotDetectionService.analyse(null).hotspots().size();
        } catch (RuntimeException ex) {
            hotspotCount = 0;
        }

        return new AdminDtos.DashboardSummary(
                incidentRepository.count(),
                incidentRepository.countBySubmittedAtAfter(startOfToday),
                incidentRepository.countByStatusIn(PENDING),
                incidentRepository.countByStatusIn(IN_PROGRESS),
                incidentRepository.countByStatusIn(RESOLVED),
                incidentRepository.countByPriority(PriorityLevel.CRITICAL),
                incidentRepository.countBySosTriggeredTrueAndStatusNotIn(RESOLVED),
                hotspotCount,
                alertRepository.countByStatus(AlertStatus.FAILED),
                incidentRepository.countByStatusIn(PENDING),
                priorityBreakdown,
                statusBreakdown,
                Instant.now());
    }
}
