package com.ecopria.action.config;

import com.ecopria.action.model.Action;
import com.ecopria.action.model.Action.ActionStatus;
import com.ecopria.action.model.Association;
import com.ecopria.action.model.Categorie;
import com.ecopria.action.repository.ActionRepository;
import com.ecopria.action.repository.AssociationRepository;
import com.ecopria.action.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Données minimales en dev local (profil {@code local}) pour tester le front sans mocks.
 */
@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class LocalDevDataInitializer implements ApplicationRunner {

    private final AssociationRepository associationRepository;
    private final CategorieRepository categorieRepository;
    private final ActionRepository actionRepository;

    @Override
    public void run(ApplicationArguments args) {
        Association association = seedAssociation();
        Categorie categorie = seedCategorie();
        seedPublishedAction(association, categorie);
    }

    private Association seedAssociation() {
        return associationRepository.findByUserId(1L).orElseGet(() -> {
            Association a = Association.builder()
                    .userId(1L)
                    .name("Méditerranée Propre")
                    .description("Association de protection de l'environnement en Méditerranée.")
                    .city("Marseille")
                    .build();
            Association saved = associationRepository.save(a);
            log.info("[dev] Association user_id=1 créée dans db_action");
            return saved;
        });
    }

    private Categorie seedCategorie() {
        return categorieRepository.findAll().stream().findFirst().orElseGet(() -> {
            Categorie c = Categorie.builder()
                    .name("Nettoyage")
                    .description("Actions de nettoyage et collecte de déchets")
                    .build();
            Categorie saved = categorieRepository.save(c);
            log.info("[dev] Catégorie '{}' créée", saved.getName());
            return saved;
        });
    }

    private void seedPublishedAction(Association association, Categorie categorie) {
        if (actionRepository.countByAssociationId(association.getId()) > 0) {
            return;
        }
        LocalDateTime start = LocalDateTime.now().plusDays(7).withHour(10).withMinute(0);
        Action action = Action.builder()
                .title("Nettoyage de la plage du Prado")
                .description("Ramassage des déchets et sensibilisation sur la côte.")
                .category(categorie)
                .latitude(43.2547)
                .longitude(5.3714)
                .address("Plage du Prado")
                .city("Marseille")
                .dateStart(start)
                .dateEnd(start.plusHours(3))
                .points(50)
                .maxParticipants(30)
                .availablePlaces(30)
                .association(association)
                .status(ActionStatus.PUBLISHED)
                .isFixed(false)
                .program(List.of("10:00 — Accueil", "10:30 — Collecte", "12:30 — Bilan"))
                .build();
        actionRepository.save(action);
        log.info("[dev] Action PUBLISHED de démo créée pour l'association {}", association.getName());
    }
}
