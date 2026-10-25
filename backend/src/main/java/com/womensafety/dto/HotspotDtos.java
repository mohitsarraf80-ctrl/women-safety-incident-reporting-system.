package com.womensafety.dto;

import java.time.Instant;
import java.util.List;

/** Hotspot analysis payloads produced by the grid-counting algorithm. */
public final class HotspotDtos {

    private HotspotDtos() {
    }

    public record Hotspot(
            String cellKey,
            double centerLatitude,
            double centerLongitude,
            long reportCount,
            double intensity,
            String zoneName,
            List<String> reportIds
    ) {
    }

    public record HotspotAnalysis(
            Instant windowStart,
            Instant windowEnd,
            int windowDays,
            int eligibleReports,
            int cellsWithReports,
            double meanCount,
            double standardDeviation,
            double threshold,
            boolean insufficientData,
            String methodNote,
            List<Hotspot> hotspots
    ) {
    }

    public record GridPoint(
            String cellKey,
            double latitude,
            double longitude,
            long count,
            boolean hotspot,
            double intensity
    ) {
    }

    public record MapResponse(
            List<GridPoint> cells,
            List<Hotspot> hotspots,
            int eligibleReports,
            double threshold,
            String disclaimer
    ) {
    }
}
