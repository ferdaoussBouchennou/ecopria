package com.ecopria.inscription.controller;

import com.ecopria.inscription.dto.InternalStatsResponse;
import com.ecopria.inscription.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/stats")
@RequiredArgsConstructor
public class InternalStatsController {

    private final InscriptionRepository inscriptionRepository;

    @GetMapping
    public ResponseEntity<InternalStatsResponse> getStats() {
        LocalDateTime from = LocalDate.now().minusDays(29).atStartOfDay();
        Map<LocalDate, Long> countsByDay = new HashMap<>();
        for (Object[] row : inscriptionRepository.countGroupedByDaySince(from)) {
            if (row[0] != null && row[1] instanceof Number number) {
                LocalDate day = LocalDate.parse(row[0].toString());
                countsByDay.put(day, number.longValue());
            }
        }

        List<Long> activity = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            activity.add(countsByDay.getOrDefault(day, 0L));
        }

        return ResponseEntity.ok(InternalStatsResponse.builder()
                .totalInscriptions(inscriptionRepository.count())
                .activityLast30Days(activity)
                .build());
    }
}
