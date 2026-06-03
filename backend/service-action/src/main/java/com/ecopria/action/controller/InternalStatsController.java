package com.ecopria.action.controller;

import com.ecopria.action.dto.InternalStatsResponse;
import com.ecopria.action.model.Action.ActionStatus;
import com.ecopria.action.repository.ActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/internal/stats")
@RequiredArgsConstructor
public class InternalStatsController {

    private final ActionRepository actionRepository;

    @GetMapping
    public ResponseEntity<InternalStatsResponse> getStats() {
        long totalActions = actionRepository.count();
        long activeActions = actionRepository.countActivePublished(LocalDateTime.now());
        long published = actionRepository.countByStatus(ActionStatus.PUBLISHED);
        return ResponseEntity.ok(InternalStatsResponse.builder()
                .totalActions(totalActions)
                .activeActions(activeActions > 0 ? activeActions : published)
                .build());
    }
}
