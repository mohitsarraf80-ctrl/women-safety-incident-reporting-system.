package com.womensafety.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Deterministic ~500 m grid used for repeat-report counting and hotspot detection.
 *
 * <p>Instead of rounding decimal places (which creates cells of different physical
 * sizes as latitude changes), this class uses a local equirectangular projection
 * centred on a configured reference latitude. The projected metres are:
 * {@code x = R * cos(refLat) * lonRad}, {@code y = R * latRad}. At the reference
 * latitude the cells are 500 m x 500 m; at 0.5 degrees away the width error is under
 * 1%. This is an approximation, not a geodesic grid, and is documented as such.</p>
 */
@Component
public class GridProjection {

    private static final double EARTH_RADIUS_METERS = 6_371_008.8;

    private final double referenceLatitude;
    private final double cellSizeMeters;
    private final double metersPerDegreeLat;
    private final double metersPerDegreeLon;

    public GridProjection(
            @Value("${app.hotspot.reference-latitude:28.5355}") double referenceLatitude,
            @Value("${app.hotspot.cell-size-meters:500}") double cellSizeMeters) {
        if (cellSizeMeters <= 0) {
            throw new IllegalArgumentException("Hotspot cell size must be positive");
        }
        this.referenceLatitude = referenceLatitude;
        this.cellSizeMeters = cellSizeMeters;
        this.metersPerDegreeLat = Math.toRadians(1) * EARTH_RADIUS_METERS;
        this.metersPerDegreeLon = metersPerDegreeLat * Math.cos(Math.toRadians(referenceLatitude));
    }

    public GridCell cellFor(double latitude, double longitude) {
        int x = (int) Math.floor((longitude * metersPerDegreeLon) / cellSizeMeters);
        int y = (int) Math.floor((latitude * metersPerDegreeLat) / cellSizeMeters);
        double centerLat = ((y + 0.5) * cellSizeMeters) / metersPerDegreeLat;
        double centerLon = ((x + 0.5) * cellSizeMeters) / metersPerDegreeLon;
        return new GridCell(x, y, centerLat, centerLon);
    }

    public String keyFor(double latitude, double longitude) {
        return cellFor(latitude, longitude).key();
    }

    public double getCellSizeMeters() {
        return cellSizeMeters;
    }

    public double getReferenceLatitude() {
        return referenceLatitude;
    }
}
