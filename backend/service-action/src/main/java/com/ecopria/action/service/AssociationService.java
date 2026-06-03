package com.ecopria.action.service;

import com.ecopria.action.model.Association;
import com.ecopria.action.repository.AssociationRepository;
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

    // appelé par le consumer Kafka quand asso.validee
    @Transactional
    public void createValidatedFromKafkaEvent(Map<String, Object> event) {
        Long userId = Long.valueOf(event.get("userId").toString());

        if (associationRepository.existsByUserId(userId)) {
            log.warn("Association déjà existante pour userId: {}", userId);
            return;
        }

        String eventCity = event.get("city") != null ? event.get("city").toString() :
                (event.get("ville") != null ? event.get("ville").toString() : null);

        Association association = Association.builder()
                .userId(userId)
                .name(event.get("nom") != null ? event.get("nom").toString() : "")
                .description(event.get("description") != null ? event.get("description").toString() : null)
                .logoUrl(event.get("logoUrl") != null ? event.get("logoUrl").toString() : null)
                .city(eventCity)
                .build();

        associationRepository.save(association);
        log.info("Association validée créée pour userId: {}", userId);
    }

    @Transactional
    public Association getOrCreateAssociation(Long userId) {
        return associationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Association assoc = Association.builder()
                            .userId(userId)
                            .name("Association")
                            .build();
                    log.info("Association par défaut créée pour userId: {}", userId);
                    return associationRepository.save(assoc);
                });
    }
}