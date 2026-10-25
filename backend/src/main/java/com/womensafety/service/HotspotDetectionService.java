package com.womensafety.service;

import com.womensafety.dto.HotspotDtos;
import com.womensafety.entity.Incident;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.util.GridCell;
import com.womensafety.util.GridProjection;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

/**
 * Grid-based hotspot detection (presentation slide 10).
 *
 * <ol>
 *   <li>Read incidents from the last N days that have valid coordinates.</li>
 *   <li>Project each coordinate onto a ~500 m grid and count reports per cell in a HashMap.</li>
 *   <li>Compute the mean and population standard deviation of the populated cell counts.</li>
 *   <li>Flag a cell when its count is strictly greater than mean + one standard deviation.</li>
 *   <li>Rank the flagged cells with a bounded min-heap PriorityQueue (O(n log k)).</li>
 * </ol>
 *
 * <p>Zero-report cells are excluded from the statistical population: the algorithm only
 * observes cells that actually contain reports, so the baseline is the density of reported
 * incidents rather than the size of the whole city. This choice is documented in the
 * README and kept consistent across the API and the dashboard.</p>
 */
@Service
public class HotspotDetectionService {

    private final IncidentRepository incidentRepository;
    private final GridProjection gridProjection;
    private final int defaultWindowDays;
    private final int topK;

    public HotspotDetectionService(IncidentRepository incidentRepository, GridProjection gridProjection,
                                   @Value("${app.hotspot.window-days:30}") int defaultWindowDays,
                                   @Value("${app.hotspot.top-k:20}") int topK) {
        this.incidentRepository = incidentRepository;
        this.gridProjection = gridProjection;
        this.defaultWindowDays = defaultWindowDays;
        this.topK = topK;
    }

    @Transactional(readOnly = true)
    public HotspotDtos.HotspotAnalysis analyse(Integer requestedDays) {
        int days = requestedDays == null ? defaultWindowDays : Math.max(1, Math.min(requestedDays, 365));
        Instant to = Instant.now();
        Instant from = to.minus(days, ChronoUnit.DAYS);
        List<Incident> incidents = incidentRepository.findGeolocatedSince(from);

        Map<String, List<Incident>> buckets = new HashMap<>();
        Map<String, GridCell> cells = new LinkedHashMap<>();
        for (Incident incident : incidents) {
            if (!isValidCoordinate(incident.getLatitude(), incident.getLongitude())) {
                continue;
            }
            GridCell cell = gridProjection.cellFor(incident.getLatitude(), incident.getLongitude());
            buckets.computeIfAbsent(cell.key(), key -> new ArrayList<>()).add(incident);
            cells.putIfAbsent(cell.key(), cell);
        }

        int populatedCells = buckets.size();
        int eligibleReports = buckets.values().stream().mapToInt(List::size).sum();
        if (populatedCells == 0) {
            return new HotspotDtos.HotspotAnalysis(from, to, days, 0, 0, 0, 0, 0, true,
                    methodNote(), List.of());
        }

        double mean = (double) eligibleReports / populatedCells;
        double variance = 0;
        for (List<Incident> bucket : buckets.values()) {
            double diff = bucket.size() - mean;
            variance += diff * diff;
        }
        variance /= populatedCells;
        double stdDev = Math.sqrt(variance);
        double threshold = mean + stdDev;
        long maxCount = buckets.values().stream().mapToLong(List::size).max().orElse(0);

        PriorityQueue<HotspotDtos.Hotspot> ranked =
                new PriorityQueue<>(Comparator.comparingLong(HotspotDtos.Hotspot::reportCount));
        for (Map.Entry<String, List<Incident>> entry : buckets.entrySet()) {
            int count = entry.getValue().size();
            if (count <= threshold) {
                continue;
            }
            GridCell cell = cells.get(entry.getKey());
            HotspotDtos.Hotspot hotspot = new HotspotDtos.Hotspot(
                    entry.getKey(),
                    round(cell.centerLatitude()),
                    round(cell.centerLongitude()),
                    count,
                    maxCount == 0 ? 0 : round((double) count / maxCount),
                    mostCommonZone(entry.getValue()),
                    entry.getValue().stream().map(Incident::getReportId).toList());
            if (ranked.size() < topK) {
                ranked.add(hotspot);
            } else if (ranked.peek() != null && count > ranked.peek().reportCount()) {
                ranked.poll();
                ranked.add(hotspot);
            }
        }

        List<HotspotDtos.Hotspot> hotspots = new ArrayList<>(ranked);
        hotspots.sort(Comparator.comparingLong(HotspotDtos.Hotspot::reportCount).reversed()
                .thenComparing(HotspotDtos.Hotspot::cellKey));

        boolean insufficient = populatedCells < 3 || eligibleReports < 5;
        return new HotspotDtos.HotspotAnalysis(from, to, days, eligibleReports, populatedCells,
                round(mean), round(stdDev), round(threshold), insufficient, methodNote(), hotspots);
    }

    @Transactional(readOnly = true)
    public HotspotDtos.MapResponse map(Integer days) {
        HotspotDtos.HotspotAnalysis analysis = analyse(days);
        Instant from = analysis.windowStart();
        List<Incident> incidents = incidentRepository.findGeolocatedSince(from);
        Map<String, Long> counts = new HashMap<>();
        Map<String, GridCell> cells = new LinkedHashMap<>();
        for (Incident incident : incidents) {
            if (!isValidCoordinate(incident.getLatitude(), incident.getLongitude())) {
                continue;
            }
            GridCell cell = gridProjection.cellFor(incident.getLatitude(), incident.getLongitude());
            counts.merge(cell.key(), 1L, Long::sum);
            cells.putIfAbsent(cell.key(), cell);
        }
        long maxCount = counts.values().stream().mapToLong(Long::longValue).max().orElse(0);
        List<HotspotDtos.GridPoint> points = new ArrayList<>();
        for (Map.Entry<String, Long> entry : counts.entrySet()) {
            GridCell cell = cells.get(entry.getKey());
            boolean isHotspot = analysis.hotspots().stream()
                    .anyMatch(h -> h.cellKey().equals(entry.getKey()));
            points.add(new HotspotDtos.GridPoint(entry.getKey(), round(cell.centerLatitude()),
                    round(cell.centerLongitude()), entry.getValue(), isHotspot,
                    maxCount == 0 ? 0 : round((double) entry.getValue() / maxCount)));
        }
        points.sort(Comparator.comparingLong(HotspotDtos.GridPoint::count).reversed());
        return new HotspotDtos.MapResponse(points, analysis.hotspots(), analysis.eligibleReports(),
                analysis.threshold(),
                "Hotspots describe where reports were submitted in the selected window, not verified crime "
                        + "rates or a prediction that an area is dangerous. Cells cover approximately "
                        + Math.round(gridProjection.getCellSizeMeters()) + " metres.");
    }

    private String methodNote() {
        return "Approximately " + Math.round(gridProjection.getCellSizeMeters())
                + " m grid via a local equirectangular projection centred at "
                + gridProjection.getReferenceLatitude()
                + " degrees north. Mean and population standard deviation are computed over populated "
                + "cells only; a cell is a hotspot when count > mean + 1 SD.";
    }

    private boolean isValidCoordinate(Double latitude, Double longitude) {
        return latitude != null && longitude != null
                && !latitude.isNaN() && !longitude.isNaN()
                && latitude >= -90 && latitude <= 90
                && longitude >= -180 && longitude <= 180;
    }

    private String mostCommonZone(List<Incident> incidents) {
        Map<String, Integer> counts = new HashMap<>();
        for (Incident incident : incidents) {
            if (incident.getZoneName() != null && !incident.getZoneName().isBlank()) {
                counts.merge(incident.getZoneName(), 1, Integer::sum);
            }
        }
        return counts.entrySet().stream().max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse(null);
    }

    private double round(double value) {
        return Math.round(value * 10_000d) / 10_000d;
    }
}
