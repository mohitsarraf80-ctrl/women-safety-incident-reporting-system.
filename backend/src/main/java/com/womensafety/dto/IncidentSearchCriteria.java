package com.womensafety.dto;

import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.enums.PriorityLevel;

import java.time.Instant;

/**
 * Bounds-checked search criteria for the administrator incident queue. Using a record
 * keeps the controller free of a long parameter list while still allowing Spring to bind
 * query parameters.
 */
public record IncidentSearchCriteria(
        String query,
        IncidentType type,
        PriorityLevel priority,
        IncidentStatus status,
        Instant from,
        Instant to,
        String sort,
        String direction,
        int page,
        int size
) {
    public IncidentSearchCriteria {
        page = Math.max(0, page);
        size = size <= 0 ? 20 : Math.min(size, 100);
        sort = sort == null || sort.isBlank() ? "severity" : sort;
        direction = direction == null || direction.isBlank() ? "desc" : direction;
    }
}
