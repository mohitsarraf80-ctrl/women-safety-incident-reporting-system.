package com.womensafety.service;

import com.womensafety.repository.IncidentRepository;
import com.womensafety.util.ReportIdGenerator;
import org.springframework.stereotype.Service;

/** Allocates public identifiers and retries on the (unlikely) event of a collision. */
@Service
public class ReportIdAllocator {

    private final IncidentRepository incidentRepository;
    private final ReportIdGenerator generator;

    public ReportIdAllocator(IncidentRepository incidentRepository, ReportIdGenerator generator) {
        this.incidentRepository = incidentRepository;
        this.generator = generator;
    }

    public String allocateReportId() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String candidate = generator.newReportId();
            if (!incidentRepository.existsByReportId(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not allocate a unique Report ID");
    }
}
