package com.womensafety.controller;

import com.womensafety.dto.AdminDtos;
import com.womensafety.dto.IncidentDtos;
import com.womensafety.entity.Responder;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.IncidentAdminService;
import com.womensafety.service.ResponderService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Responder-facing endpoints. A responder only sees cases assigned to their own profile. */
@RestController
@RequestMapping("/api/responder")
public class ResponderPortalController {

    private final ResponderService responderService;
    private final IncidentAdminService incidentAdminService;

    public ResponderPortalController(ResponderService responderService,
                                     IncidentAdminService incidentAdminService) {
        this.responderService = responderService;
        this.incidentAdminService = incidentAdminService;
    }

    @GetMapping("/profile")
    public AdminDtos.ResponderResponse profile(@AuthenticationPrincipal UserPrincipal principal) {
        // The service maps the DTO inside its transaction so the lazy login account can be read.
        return responderService.profileForUser(principal);
    }

    @GetMapping("/incidents")
    public AdminDtos.PageResponse<IncidentDtos.IncidentSummary> assigned(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Responder responder = responderService.requireForUser(principal);
        return incidentAdminService.assignedTo(responder.getId(), page, size);
    }

    @GetMapping("/incidents/{id}")
    public IncidentDtos.IncidentDetail detail(@PathVariable Long id,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return incidentAdminService.detail(id, principal);
    }

    @PatchMapping("/incidents/{id}/status")
    public IncidentDtos.IncidentDetail updateStatus(@PathVariable Long id,
                                                    @Valid @RequestBody AdminDtos.StatusUpdateRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return incidentAdminService.updateStatusAsResponder(id, request, principal);
    }
}
