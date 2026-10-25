package com.womensafety.controller;

import com.womensafety.dto.AdminDtos;
import com.womensafety.dto.IncidentDtos;
import com.womensafety.dto.IncidentSearchCriteria;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.enums.PriorityLevel;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.IncidentAdminService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

/** Administrator incident queue and case-management endpoints. */
@RestController
@RequestMapping("/api/admin/incidents")
public class AdminIncidentController {

    private final IncidentAdminService incidentAdminService;

    public AdminIncidentController(IncidentAdminService incidentAdminService) {
        this.incidentAdminService = incidentAdminService;
    }

    @GetMapping
    public AdminDtos.PageResponse<IncidentDtos.IncidentSummary> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) IncidentType type,
            @RequestParam(required = false) PriorityLevel priority,
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "severity") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return incidentAdminService.search(new IncidentSearchCriteria(q, type, priority, status,
                from, to, sort, direction, page, size));
    }

    @GetMapping("/{id}")
    public IncidentDtos.IncidentDetail detail(@PathVariable Long id,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return incidentAdminService.detail(id, principal);
    }

    @PatchMapping("/{id}/status")
    public IncidentDtos.IncidentDetail updateStatus(@PathVariable Long id,
                                                    @Valid @RequestBody AdminDtos.StatusUpdateRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return incidentAdminService.updateStatus(id, request, principal);
    }

    @PatchMapping("/{id}/assign")
    public IncidentDtos.IncidentDetail assign(@PathVariable Long id,
                                              @Valid @RequestBody AdminDtos.AssignResponderRequest request,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return incidentAdminService.assign(id, request, principal);
    }

    @PostMapping("/{id}/escalate")
    public IncidentDtos.IncidentDetail escalate(@PathVariable Long id,
                                                @Valid @RequestBody AdminDtos.EscalateRequest request,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        return incidentAdminService.escalate(id, request, principal);
    }

    @PostMapping("/{id}/notes")
    public IncidentDtos.IncidentDetail addNote(@PathVariable Long id,
                                               @Valid @RequestBody AdminDtos.AddNoteRequest request,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        return incidentAdminService.addNote(id, request, principal);
    }

    @GetMapping("/{id}/evidence/{evidenceId}")
    public ResponseEntity<Resource> downloadEvidence(@PathVariable Long id, @PathVariable Long evidenceId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        IncidentAdminService.EvidenceDownload download =
                incidentAdminService.downloadEvidence(id, evidenceId, principal);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(download.filename(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(download.resource());
    }
}
