package com.womensafety.controller;

import com.womensafety.security.UserPrincipal;
import com.womensafety.service.IncidentAccessPolicy;
import com.womensafety.service.IncidentAdminService;
import com.womensafety.service.IncidentService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

/**
 * Authorised evidence download shared by administrators and assigned responders. Files are
 * never exposed through a public static URL.
 */
@RestController
@RequestMapping("/api/evidence")
public class EvidenceController {

    private final IncidentAdminService incidentAdminService;
    private final IncidentService incidentService;
    private final IncidentAccessPolicy accessPolicy;

    public EvidenceController(IncidentAdminService incidentAdminService, IncidentService incidentService,
                              IncidentAccessPolicy accessPolicy) {
        this.incidentAdminService = incidentAdminService;
        this.incidentService = incidentService;
        this.accessPolicy = accessPolicy;
    }

    @GetMapping("/{incidentId}/{evidenceId}")
    public ResponseEntity<Resource> download(@PathVariable Long incidentId, @PathVariable Long evidenceId,
                                             @AuthenticationPrincipal UserPrincipal principal) {
        accessPolicy.assertStaffCanView(incidentService.requireIncident(incidentId), principal);
        IncidentAdminService.EvidenceDownload download =
                incidentAdminService.downloadEvidence(incidentId, evidenceId, principal);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(download.filename(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(download.resource());
    }
}
