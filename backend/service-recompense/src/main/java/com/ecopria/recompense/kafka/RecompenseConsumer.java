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

    // ── écoute user.inscrit pour créer le partenaire ──────────
    @KafkaListener(topics = "user.inscrit", groupId = "service-recompense")
    public void onUserRegistered(Map<String, Object> event) {
        String role = (String) event.get("role");
        if ("PARTENAIRE".equals(role)) {
            Long userId = Long.valueOf(event.get("userId").toString());
            log.info("Nouveau partenaire reçu userId: {}", userId);

            if (partenaireRepository.existsByUserId(userId)) {
                log.warn("Partenaire déjà existant pour userId: {}", userId);
                return;
            }

            Partenaire partenaire = Partenaire.builder()
                    .userId(userId)
                    .name(event.get("nom") != null ? event.get("nom").toString() : "")
                    .isValidated(false)
                    .build();

            partenaireRepository.save(partenaire);
            log.info("Partenaire créé pour userId: {}", userId);
        }
    }

    // ── écoute compte.valide pour valider le partenaire ───────
    @KafkaListener(topics = "compte.valide", groupId = "service-recompense")
    public void onAccountValidated(Map<String, Object> event) {
        String type = (String) event.get("type");
        if ("PARTENAIRE".equals(type)) {
            Long userId = Long.valueOf(event.get("userId").toString());
            log.info("Validation partenaire userId: {}", userId);

            partenaireRepository.findByUserId(userId).ifPresent(partenaire -> {
                partenaire.setIsValidated(true);
                partenaireRepository.save(partenaire);
                log.info("Partenaire validé userId: {}", userId);
            });
        }
    }
}