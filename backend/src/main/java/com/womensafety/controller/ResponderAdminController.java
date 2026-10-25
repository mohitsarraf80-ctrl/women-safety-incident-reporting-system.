package com.womensafety.controller;

import com.womensafety.dto.AdminDtos;
import com.womensafety.dto.IncidentDtos;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.IncidentAdminService;
import com.womensafety.service.ResponderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/responders")
public class ResponderAdminController {

    private final ResponderService responderService;
    private final IncidentAdminService incidentAdminService;

    public ResponderAdminController(ResponderService responderService,
                                    IncidentAdminService incidentAdminService) {
        this.responderService = responderService;
        this.incidentAdminService = incidentAdminService;
    }

    @GetMapping
    public List<AdminDtos.ResponderResponse> list() {
        return responderService.list();
    }

    @PostMapping
    public AdminDtos.ResponderResponse create(@Valid @RequestBody AdminDtos.ResponderCreateRequest request) {
        return responderService.create(request);
    }

    @PatchMapping("/{id}")
    public AdminDtos.ResponderResponse update(@PathVariable Long id,
                                              @Valid @RequestBody AdminDtos.ResponderUpdateRequest request) {
        return responderService.update(id, request);
    }

    @GetMapping("/{id}/incidents")
    public AdminDtos.PageResponse<IncidentDtos.IncidentSummary> incidents(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return incidentAdminService.assignedTo(id, page, size);
    }

    @PatchMapping("/{id}/availability")
    public AdminDtos.ResponderResponse availability(@PathVariable Long id,
                                                    @Valid @RequestBody AdminDtos.ResponderUpdateRequest request) {
        return responderService.update(id, request);
    }
}
