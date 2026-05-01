package com.ecopria.recompense.kafka;

import com.ecopria.recompense.model.Partenaire;
import com.ecopria.recompense.repository.PartenaireRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecompenseConsumer {

    private final PartenaireRepository partenaireRepository;

    // ── écoute partenaire.validee pour créer le partenaire ──────────
    @KafkaListener(topics = "partenaire.validee", groupId = "service-recompense")
    public void onPartenaireValidated(Map<String, Object> event) {
        Long userId = Long.valueOf(event.get("userId").toString());
        log.info("Partenaire validé reçu depuis admin, userId: {}", userId);

        if (partenaireRepository.existsByUserId(userId)) {
            log.warn("Partenaire déjà existant pour userId: {}", userId);
            return;
        }

        Partenaire partenaire = Partenaire.builder()
                .userId(userId)
                .name(event.get("nom") != null ? event.get("nom").toString() : "")
                .category(event.get("categorie") != null ? event.get("categorie").toString() : null)
                .build();

        partenaireRepository.save(partenaire);
        log.info("Partenaire créé localement pour userId: {}", userId);
    }
}