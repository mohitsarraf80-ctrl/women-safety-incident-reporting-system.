package com.womensafety.controller;

import com.womensafety.dto.IncidentDtos;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Incident reporting endpoints. Both multipart (payload + optional evidence in one request)
 * and JSON submissions are accepted; anonymous callers do not need a token.
 */
@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDtos.CreatedResponse submitMultipart(
            @Valid @RequestPart("payload") IncidentDtos.CreateRequest payload,
            @RequestPart(value = "evidence", required = false) MultipartFile evidence,
            @AuthenticationPrincipal UserPrincipal principal) {
        return incidentService.submit(payload, evidence, principal);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDtos.CreatedResponse submitJson(
            @Valid @RequestBody IncidentDtos.CreateRequest payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        return incidentService.submit(payload, null, principal);
    }

    @GetMapping("/my")
    public List<IncidentDtos.IncidentSummary> myReports(@AuthenticationPrincipal UserPrincipal principal) {
        return incidentService.myReports(principal);
    }

    @GetMapping("/{id}")
    public IncidentDtos.IncidentDetail detail(@PathVariable Long id,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return incidentService.detailForReporter(id, principal);
    }

    @PostMapping(value = "/{reportId}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDtos.EvidenceUploadResponse addEvidence(
            @PathVariable String reportId,
            @RequestPart("file") MultipartFile file,
            @RequestHeader(value = "X-Tracking-Code", required = false) String trackingCode,
            @AuthenticationPrincipal UserPrincipal principal) {
        return incidentService.addEvidence(reportId, trackingCode, file, principal);
    }
}
