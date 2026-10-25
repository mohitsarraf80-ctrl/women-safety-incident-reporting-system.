package com.womensafety.controller;

import com.womensafety.dto.HotspotDtos;
import com.womensafety.service.HotspotDetectionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/hotspots")
public class HotspotController {

    private final HotspotDetectionService hotspotDetectionService;

    public HotspotController(HotspotDetectionService hotspotDetectionService) {
        this.hotspotDetectionService = hotspotDetectionService;
    }

    @GetMapping
    public HotspotDtos.HotspotAnalysis hotspots(@RequestParam(required = false) Integer days) {
        return hotspotDetectionService.analyse(days);
    }

    @GetMapping("/map")
    public HotspotDtos.MapResponse map(@RequestParam(required = false) Integer days) {
        return hotspotDetectionService.map(days);
    }
}
