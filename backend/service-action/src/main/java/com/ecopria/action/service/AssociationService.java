package com.ecopria.action.service;

import com.ecopria.action.dto.AssociationPublicDTO;
import com.ecopria.action.model.Association;
import com.ecopria.action.repository.AssociationRepository;
import com.ecopria.action.repository.ActionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssociationService {

    private final AssociationRepository associationRepository;
    private final ActionRepository actionRepository;

    // appelé par le consumer Kafka quand user.inscrit avec role ASSOCIATION
    @Transactional
    public void createFromKafkaEvent(Map<String, Object> event) {
        Long userId = Long.valueOf(event.get("userId").toString());

        if (associationRepository.existsByUserId(userId)) {
            log.warn("Association déjà existante pour userId: {}", userId);
            return;
        }

        Association association = Association.builder()
                .userId(userId)
                .name(event.get("nom") != null ? event.get("nom").toString() : "")
                .isValidated(false)
                .build();

        associationRepository.save(association);
        log.info("Association créée pour userId: {}", userId);
    }

    // appelé par le consumer Kafka quand compte.valide
    @Transactional
    public void validateByUserId(Long userId) {
        associationRepository.findByUserId(userId).ifPresent(association -> {
            association.setIsValidated(true);
            associationRepository.save(association);
            log.info("Association validée pour userId: {}", userId);
        });
    }

    // page profil public de l'association
    @Transactional(readOnly = true)
    public AssociationPublicDTO getPublicProfile(Long associationId) {
        Association association = associationRepository.findById(associationId)
                .orElseThrow(() -> new RuntimeException("Association non trouvée"));

        Long totalActions = actionRepository.countByAssociationId(associationId);

        return AssociationPublicDTO.builder()
                .id(association.getId())
                .name(association.getName())
                .description(association.getDescription())
                .logoUrl(association.getLogoUrl())
                .city(association.getCity())
                .totalActions(totalActions)
                .build();
    }

    // l'association connectée récupère son propre profil
    @Transactional(readOnly = true)
    public Association getByUserId(Long userId) {
        return associationRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Association non trouvée pour userId: " + userId));
    }
}