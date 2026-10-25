package com.womensafety.controller;

import com.womensafety.dto.IncidentDtos;
import com.womensafety.dto.SosDtos;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.ReportTrackingService;
import com.womensafety.service.SosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Simulated SOS endpoints. Activation is public so an unregistered user can request help. */
@RestController
@RequestMapping("/api/sos")
public class SosController {

    private final SosService sosService;
    private final ReportTrackingService reportTrackingService;

    public SosController(SosService sosService, ReportTrackingService reportTrackingService) {
        this.sosService = sosService;
        this.reportTrackingService = reportTrackingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SosDtos.SosResponse activate(@Valid @RequestBody SosDtos.SosRequest request,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        return sosService.activate(request, principal);
    }

    /**
     * The path variable is the Report ID returned by activation. The tracking code must be
     * supplied in the X-Tracking-Code header, so a guessed ID alone reveals nothing.
     */
    @GetMapping("/{reportId}")
    public IncidentDtos.TrackingResponse status(@PathVariable String reportId,
                                                @RequestHeader("X-Tracking-Code") String trackingCode) {
        return reportTrackingService.track(new IncidentDtos.TrackingRequest(reportId, trackingCode));
    }
}
