package com.womensafety.service;

import com.womensafety.entity.Incident;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.util.GridProjection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/** Unit tests for the grid-based hotspot algorithm. */
class HotspotDetectionServiceTest {

    private IncidentRepository repository;
    private HotspotDetectionService service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(IncidentRepository.class);
        GridProjection projection = new GridProjection(28.5355, 500);
        service = new HotspotDetectionService(repository, projection, 30, 20);
    }

    private Incident incidentAt(String id, double lat, double lon, int minutesAgo) {
        Incident incident = Incident.create(id, "hash", IncidentType.STALKING,
                "Fictional test incident used to exercise the hotspot algorithm.",
                Instant.now().minusSeconds(3600), "Test Zone", lat, lon, "cell",
                true, null);
        incident.overrideTimestampsForDemo(Instant.now().minusSeconds(minutesAgo * 60L), null);
        incident.applySeverity(35, com.womensafety.enums.PriorityLevel.MEDIUM, 35, 0, 0, 0, 0);
        return incident;
    }

    @Test
    @DisplayName("A dense cluster stands out and is ranked first")
    void detectsDenseCluster() {
        List<Incident> incidents = new ArrayList<>();
        // 7 reports at the same station: they belong to exactly one 500 m cell.
        for (int i = 0; i < 7; i++) {
            incidents.add(incidentAt("WS-CLUSTER" + i, 28.6205, 77.3700, i + 1));
        }
        // Three isolated reports in different cells.
        incidents.add(incidentAt("WS-SINGLE1", 28.5645, 77.3340, 20));
        incidents.add(incidentAt("WS-SINGLE2", 28.5709, 77.3260, 30));
        incidents.add(incidentAt("WS-SINGLE3", 28.4744, 77.5040, 40));
        when(repository.findGeolocatedSince(any())).thenReturn(incidents);

        var analysis = service.analyse(30);

        assertThat(analysis.eligibleReports()).isEqualTo(10);
        assertThat(analysis.cellsWithReports()).isEqualTo(4);
        assertThat(analysis.hotspots()).hasSize(1);
        assertThat(analysis.hotspots().get(0).reportCount()).isEqualTo(7);
        assertThat(analysis.hotspots().get(0).reportIds()).hasSize(7);
        assertThat(analysis.insufficientData()).isFalse();
        // counts are [7,1,1,1]: mean 2.5, sd 2.5981, threshold 5.0981
        assertThat(analysis.meanCount()).isEqualTo(2.5);
        assertThat(analysis.threshold()).isGreaterThan(5.0).isLessThan(5.2);
    }

    @Test
    @DisplayName("Empty database produces an empty, clearly-flagged analysis")
    void handlesNoIncidents() {
        when(repository.findGeolocatedSince(any())).thenReturn(List.of());
        var analysis = service.analyse(30);
        assertThat(analysis.eligibleReports()).isZero();
        assertThat(analysis.cellsWithReports()).isZero();
        assertThat(analysis.hotspots()).isEmpty();
        assertThat(analysis.insufficientData()).isTrue();
    }

    @Test
    @DisplayName("One populated cell cannot be a hotspot (count is never greater than itself)")
    void handlesSingleCell() {
        when(repository.findGeolocatedSince(any()))
                .thenReturn(List.of(incidentAt("WS-ONE", 28.6205, 77.3700, 5)));
        var analysis = service.analyse(30);
        assertThat(analysis.cellsWithReports()).isEqualTo(1);
        assertThat(analysis.standardDeviation()).isZero();
        assertThat(analysis.hotspots()).isEmpty();
        assertThat(analysis.insufficientData()).isTrue();
    }

    @Test
    @DisplayName("Identical counts across cells produce no hotspot")
    void handlesIdenticalCounts() {
        List<Incident> incidents = new ArrayList<>();
        incidents.add(incidentAt("WS-A1", 28.6205, 77.3700, 1));
        incidents.add(incidentAt("WS-A2", 28.6205, 77.3700, 2));
        incidents.add(incidentAt("WS-B1", 28.5645, 77.3340, 3));
        incidents.add(incidentAt("WS-B2", 28.5645, 77.3340, 4));
        when(repository.findGeolocatedSince(any())).thenReturn(incidents);
        var analysis = service.analyse(30);
        assertThat(analysis.standardDeviation()).isZero();
        assertThat(analysis.hotspots()).isEmpty();
    }

    @Test
    @DisplayName("Invalid or missing coordinates are ignored, not counted")
    void ignoresInvalidCoordinates() {
        Incident invalid = incidentAt("WS-INVALID", 999, 999, 1);
        when(repository.findGeolocatedSince(any())).thenReturn(List.of(invalid));
        var analysis = service.analyse(30);
        assertThat(analysis.eligibleReports()).isZero();
        assertThat(analysis.hotspots()).isEmpty();
    }

    @Test
    @DisplayName("Map data includes every populated cell and flags hotspots")
    void mapDataContainsAllCells() {
        List<Incident> incidents = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            incidents.add(incidentAt("WS-M" + i, 28.6205, 77.3700, i + 1));
        }
        incidents.add(incidentAt("WS-N1", 28.5645, 77.3340, 10));
        incidents.add(incidentAt("WS-N2", 28.5709, 77.3260, 11));
        when(repository.findGeolocatedSince(any())).thenReturn(incidents);

        var map = service.map(30);
        assertThat(map.cells()).hasSize(3);
        assertThat(map.cells().stream().filter(c -> c.count() == 6)).hasSize(1);
        assertThat(map.cells().stream().anyMatch(c -> c.hotspot() && c.count() == 6)).isTrue();
        assertThat(map.disclaimer()).contains("not verified crime rates");
    }
}
