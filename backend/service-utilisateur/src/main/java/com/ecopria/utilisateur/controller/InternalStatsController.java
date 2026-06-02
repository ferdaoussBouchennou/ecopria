package com.ecopria.utilisateur.controller;

import com.ecopria.utilisateur.dto.InternalStatsResponse;
import com.ecopria.utilisateur.repository.CitizenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/stats")
@RequiredArgsConstructor
public class InternalStatsController {

    private final CitizenRepository citizenRepository;

    @GetMapping
    public ResponseEntity<InternalStatsResponse> getStats() {
        Long points = citizenRepository.sumTotalPoints();
        return ResponseEntity.ok(InternalStatsResponse.builder()
                .totalPointsDistributed(points != null ? points : 0L)
                .build());
    }
}
