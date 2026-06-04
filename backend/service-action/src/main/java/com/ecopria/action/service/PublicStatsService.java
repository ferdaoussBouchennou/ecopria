package com.ecopria.action.service;

import com.ecopria.action.dto.PublicStatsDTO;
import com.ecopria.action.model.Action.ActionStatus;
import com.ecopria.action.repository.ActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PublicStatsService {

    private final ActionRepository actionRepository;

    @Transactional(readOnly = true)
    public PublicStatsDTO getPublicStats() {
        LocalDateTime now = LocalDateTime.now();
        return PublicStatsDTO.builder()
                .actionsRealisees(actionRepository.countByStatus(ActionStatus.COMPLETED))
                .participantsInscrits(actionRepository.sumRegisteredParticipants())
                .actionsEnCours(actionRepository.countActivePublished(now))
                .build();
    }
}
