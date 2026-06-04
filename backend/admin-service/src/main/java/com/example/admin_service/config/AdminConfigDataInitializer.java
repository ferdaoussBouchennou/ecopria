package com.example.admin_service.config;

import com.example.admin_service.model.Configuration;
import com.example.admin_service.repository.ConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminConfigDataInitializer implements ApplicationRunner {

    private final ConfigurationRepository configurationRepository;

    private record DefaultConfig(String cle, String valeur, String description) {}

    private static final List<DefaultConfig> DEFAULTS = List.of(
            new DefaultConfig(
                    "taux_commission",
                    "15",
                    "Taux de commission global prélevé sur les offres partenaires (%)"
            ),
            new DefaultConfig(
                    "points_defaut_action",
                    "50",
                    "Points EcoPria attribués par défaut lors de la création d'une action"
            ),
            new DefaultConfig(
                    "places_max_defaut_action",
                    "30",
                    "Nombre de places maximum par défaut pour une nouvelle action"
            ),
            new DefaultConfig(
                    "email_support",
                    "contact@ecopria.ma",
                    "Adresse e-mail de support affichée aux utilisateurs"
            ),
            new DefaultConfig(
                    "delai_resend_verification_sec",
                    "60",
                    "Délai minimum entre deux envois de code de vérification (secondes)"
            ),
            new DefaultConfig(
                    "plateforme_maintenance",
                    "false",
                    "Mode maintenance : bloque l'accès public si « true » (à brancher côté gateway)"
            )
    );

    @Override
    public void run(ApplicationArguments args) {
        for (DefaultConfig def : DEFAULTS) {
            ensure(def.cle(), def.valeur(), def.description());
        }
    }

    private void ensure(String cle, String valeur, String description) {
        configurationRepository.findByCle(cle).orElseGet(() ->
                configurationRepository.save(Configuration.builder()
                        .cle(cle)
                        .valeur(valeur)
                        .description(description)
                        .updatedAt(LocalDateTime.now())
                        .build())
        );
    }
}
