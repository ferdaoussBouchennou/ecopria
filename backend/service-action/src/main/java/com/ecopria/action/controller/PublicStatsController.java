package com.ecopria.action.controller;

import com.ecopria.action.dto.PublicStatsDTO;
import com.ecopria.action.service.PublicStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicStatsController {

    private final PublicStatsService publicStatsService;

    @GetMapping("/stats")
    public ResponseEntity<PublicStatsDTO> getStats() {
        return ResponseEntity.ok(publicStatsService.getPublicStats());
    }
}
