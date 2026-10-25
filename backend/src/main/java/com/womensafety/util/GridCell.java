package com.womensafety.util;

/**
 * One ~500 metre grid cell. Keys are stable strings so they can be stored on an
 * incident and reused for repeat-report counting and hotspot aggregation.
 */
public record GridCell(int x, int y, double centerLatitude, double centerLongitude) {

    public String key() {
        return x + ":" + y;
    }
}
