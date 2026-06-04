package com.example.admin_service.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/** Catégories par défaut (maquettes Ecopria) — images servies par le frontend Angular. */
public final class AdminCategoryDefaults {

    private AdminCategoryDefaults() {}

    @Getter
    @AllArgsConstructor
    public static class SeedCategory {
        private final String nom;
        private final String description;
        private final String imageUrl;
    }

    public static final List<SeedCategory> SEED = List.of(
            new SeedCategory("Nettoyage", "Plages, forêts & oueds", "/assets/images/cat-nettoyage.jpg"),
            new SeedCategory("Reboisement", "Plantation & vergers", "/assets/images/cat-reboisement.jpg"),
            new SeedCategory("Sensibilisation", "Ateliers & écoles", "/assets/images/cat-sensibilisation.jpg"),
            new SeedCategory("Recyclage", "Collecte & repair café", "/assets/images/cat-recyclage.jpg"),
            new SeedCategory("Compostage", "Lombri & biodéchets", "/assets/images/cat-compostage.jpg")
    );
}
