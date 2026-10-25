package com.womensafety.controller;

import com.womensafety.dto.IncidentDtos;
import com.womensafety.service.ReportTrackingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public, credential-verified report tracking. No authentication is required. */
@RestController
@RequestMapping("/api/reports")
public class ReportTrackingController {

    private final ReportTrackingService reportTrackingService;

    public ReportTrackingController(ReportTrackingService reportTrackingService) {
        this.reportTrackingService = reportTrackingService;
    }

    @PostMapping("/track")
    public IncidentDtos.TrackingResponse track(@Valid @RequestBody IncidentDtos.TrackingRequest request) {
        return reportTrackingService.track(request);
    }
}
