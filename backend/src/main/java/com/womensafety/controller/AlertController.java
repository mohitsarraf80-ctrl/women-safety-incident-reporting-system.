package com.womensafety.controller;

import com.womensafety.dto.AdminDtos;
import com.womensafety.enums.AlertStatus;
import com.womensafety.enums.NotificationChannel;
import com.womensafety.service.AlertService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public AdminDtos.PageResponse<AdminDtos.AlertResponse> list(
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) NotificationChannel channel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return alertService.search(status, channel, page, size);
    }

    @GetMapping("/{id}")
    public AdminDtos.AlertResponse get(@PathVariable Long id) {
        return alertService.get(id);
    }

    @PostMapping("/{id}/retry")
    public AdminDtos.AlertResponse retry(@PathVariable Long id) {
        return alertService.retry(id);
    }
}
