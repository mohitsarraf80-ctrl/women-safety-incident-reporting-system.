package com.womensafety.service;

import com.womensafety.dto.AnalyticsDtos;
import com.womensafety.entity.Incident;
import com.womensafety.entity.Responder;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.enums.PriorityLevel;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.ResponderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Analytics aggregation for the charts. Counts are produced by JPQL group-by queries;
 * time-series bucketing happens in the display time zone so a "day" matches what an
 * administrator in Noida expects.
 */
@Service
public class AnalyticsService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final List<IncidentStatus> PENDING = List.of(IncidentStatus.SUBMITTED,
            IncidentStatus.UNDER_REVIEW, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS);
    private static final List<IncidentStatus> RESOLVED = List.of(IncidentStatus.RESOLVED,
            IncidentStatus.CLOSED);

    private final IncidentRepository incidentRepository;
    private final ResponderRepository responderRepository;
    private final ZoneId displayZone;

    public AnalyticsService(IncidentRepository incidentRepository, ResponderRepository responderRepository,
                            @Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        this.incidentRepository = incidentRepository;
        this.responderRepository = responderRepository;
        this.displayZone = ZoneId.of(zone);
    }

    @Transactional(readOnly = true)
    public AnalyticsDtos.Overview overview(Instant from, Instant to) {
        Range range = range(from, to);
        List<Incident> incidents = incidentRepository.findAllBetween(range.from(), range.to());
        long resolved = incidents.stream().filter(i -> RESOLVED.contains(i.getStatus())).count();
        long pending = incidents.stream().filter(i -> PENDING.contains(i.getStatus())).count();
        long sos = incidents.stream().filter(Incident::isSosTriggered).count();
        long critical = incidents.stream().filter(i -> i.getPriority() == PriorityLevel.CRITICAL).count();
        List<Long> durations = durations(incidents);
        double average = durations.isEmpty() ? 0
                : durations.stream().mapToLong(Long::longValue).average().orElse(0) / 3600.0;
        return new AnalyticsDtos.Overview(incidents.size(), resolved, pending, sos, critical,
                round(average), durations.size(), range.from(), range.to());
    }

    @Transactional(readOnly = true)
    public AnalyticsDtos.Charts charts(Instant from, Instant to) {
        Range range = range(from, to);
        List<Incident> incidents = incidentRepository.findAllBetween(range.from(), range.to());

        List<AnalyticsDtos.CountItem> byCategory = new ArrayList<>();
        for (Object[] row : incidentRepository.countByTypeBetween(range.from(), range.to())) {
            IncidentType type = (IncidentType) row[0];
            byCategory.add(new AnalyticsDtos.CountItem(type.name(), type.getLabel(), ((Number) row[1]).longValue()));
        }

        List<AnalyticsDtos.CountItem> byPriority = new ArrayList<>();
        for (Object[] row : incidentRepository.countByPriorityBetween(range.from(), range.to())) {
            PriorityLevel priority = (PriorityLevel) row[0];
            byPriority.add(new AnalyticsDtos.CountItem(priority.name(), priority.getLabel(),
                    ((Number) row[1]).longValue()));
        }

        List<AnalyticsDtos.CountItem> byStatus = new ArrayList<>();
        for (Object[] row : incidentRepository.countByStatusBetween(range.from(), range.to())) {
            IncidentStatus status = (IncidentStatus) row[0];
            byStatus.add(new AnalyticsDtos.CountItem(status.name(), status.getLabel(),
                    ((Number) row[1]).longValue()));
        }

        Map<LocalDate, Long> daily = new LinkedHashMap<>();
        LocalDate cursor = range.from().atZone(displayZone).toLocalDate();
        LocalDate last = range.to().atZone(displayZone).toLocalDate();
        while (!cursor.isAfter(last)) {
            daily.put(cursor, 0L);
            cursor = cursor.plusDays(1);
        }
        for (Incident incident : incidents) {
            LocalDate day = incident.getSubmittedAt().atZone(displayZone).toLocalDate();
            daily.computeIfPresent(day, (key, value) -> value + 1);
        }
        List<AnalyticsDtos.TimeSeriesPoint> overTime = daily.entrySet().stream()
                .map(entry -> new AnalyticsDtos.TimeSeriesPoint(entry.getKey().format(DATE), entry.getValue()))
                .toList();

        List<AnalyticsDtos.ResponderWorkload> workload = new ArrayList<>();
        for (Responder responder : responderRepository.findAllByOrderByDisplayNameAsc()) {
            long active = incidentRepository.countByResponderIdAndStatusIn(responder.getId(),
                    List.of(IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS));
            long total = incidentRepository.countByResponderId(responder.getId());
            workload.add(new AnalyticsDtos.ResponderWorkload(responder.getDisplayName(), active, total));
        }

        long resolved = incidents.stream().filter(i -> RESOLVED.contains(i.getStatus())).count();
        long pending = incidents.stream().filter(i -> PENDING.contains(i.getStatus())).count();
        long sos = incidents.stream().filter(Incident::isSosTriggered).count();

        return new AnalyticsDtos.Charts(byCategory, byPriority, byStatus, overTime, workload,
                resolved, pending, sos, range.from(), range.to());
    }

    @Transactional(readOnly = true)
    public AnalyticsDtos.ResponseTimes responseTimes(Instant from, Instant to) {
        Range range = range(from, to);
        List<Incident> resolved = incidentRepository.findResolvedBetween(range.from(), range.to());
        List<Long> durations = resolved.stream()
                .filter(i -> i.getResolvedAt() != null)
                .map(i -> Duration.between(i.getSubmittedAt(), i.getResolvedAt()).getSeconds())
                .sorted()
                .toList();
        double average = durations.isEmpty() ? 0
                : durations.stream().mapToLong(Long::longValue).average().orElse(0) / 3600.0;
        double median = 0;
        if (!durations.isEmpty()) {
            int mid = durations.size() / 2;
            median = durations.size() % 2 == 0
                    ? (durations.get(mid - 1) + durations.get(mid)) / 2.0 / 3600.0
                    : durations.get(mid) / 3600.0;
        }
        List<AnalyticsDtos.CountItem> byPriority = new ArrayList<>();
        for (PriorityLevel priority : PriorityLevel.values()) {
            List<Long> subset = resolved.stream()
                    .filter(i -> i.getPriority() == priority)
                    .map(i -> Duration.between(i.getSubmittedAt(), i.getResolvedAt()).getSeconds())
                    .toList();
            long hours = subset.isEmpty() ? 0
                    : Math.round(subset.stream().mapToLong(Long::longValue).average().orElse(0) / 3600.0);
            byPriority.add(new AnalyticsDtos.CountItem(priority.name(), priority.getLabel(), hours));
        }
        return new AnalyticsDtos.ResponseTimes(round(average), round(median), durations.size(),
                byPriority, range.from(), range.to());
    }

    /**
     * Privacy-restricted CSV export for administrators. Contains no descriptions, contact
     * details or coordinates, and every field is escaped to prevent spreadsheet injection.
     */
    @Transactional(readOnly = true)
    public String exportCsv(Instant from, Instant to) {
        Range range = range(from, to);
        StringBuilder sb = new StringBuilder();
        sb.append("report_id,category,priority,status,submitted_at,occurred_at,zone,anonymous,sos,severity_score\n");
        for (Incident incident : incidentRepository.findAllBetween(range.from(), range.to())) {
            sb.append(csv(incident.getReportId())).append(',')
                    .append(csv(incident.getIncidentType().name())).append(',')
                    .append(csv(incident.getPriority().name())).append(',')
                    .append(csv(incident.getStatus().name())).append(',')
                    .append(csv(incident.getSubmittedAt().toString())).append(',')
                    .append(csv(incident.getOccurredAt().toString())).append(',')
                    .append(csv(incident.getZoneName())).append(',')
                    .append(incident.isAnonymous()).append(',')
                    .append(incident.isSosTriggered()).append(',')
                    .append(incident.getSeverityScore()).append('\n');
        }
        return sb.toString();
    }

    private String csv(String value) {
        if (value == null) {
            return "";
        }
        String safe = value;
        if (!safe.isEmpty() && "=+-@".indexOf(safe.charAt(0)) >= 0) {
            safe = "'" + safe;
        }
        return '"' + safe.replace("\"", "\"\"") + '"';
    }

    private List<Long> durations(List<Incident> incidents) {
        return incidents.stream()
                .filter(i -> i.getResolvedAt() != null && RESOLVED.contains(i.getStatus()))
                .map(i -> Duration.between(i.getSubmittedAt(), i.getResolvedAt()).getSeconds())
                .toList();
    }

    private Range range(Instant from, Instant to) {
        Instant end = to == null ? Instant.now() : to;
        Instant start = from == null ? end.minus(30, ChronoUnit.DAYS) : from;
        if (start.isAfter(end)) {
            Instant swap = start;
            start = end;
            end = swap;
        }
        return new Range(start, end);
    }

    private double round(double value) {
        return Math.round(value * 100d) / 100d;
    }

    public record Range(Instant from, Instant to) {
    }
}
