package com.example.admin_service.service;


import com.example.admin_service.dto.request.ConfigurationRequest;
import com.example.admin_service.dto.response.ConfigurationResponse;
import com.example.admin_service.model.Configuration;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.ConfigurationRepository;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminConfigService {

    private final ConfigurationRepository configRepository;
    private final LogAdminRepository logAdminRepository;

    public List<ConfigurationResponse> getAll() {
        return configRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getCle().compareToIgnoreCase(b.getCle()))
                .map(this::toResponse)
                .toList();
    }

    private static void validate(String cle, String valeur) {
        if (valeur.isBlank()) {
            throw new IllegalArgumentException("La valeur ne peut pas être vide.");
        }
        switch (cle) {
            case "taux_commission" -> {
                double rate = parseDouble(cle, valeur);
                if (rate < 5 || rate > 30) {
                    throw new IllegalArgumentException("Le taux de commission doit être entre 5 et 30 %.");
                }
            }
            case "points_defaut_action", "places_max_defaut_action", "delai_resend_verification_sec" -> {
                int n = parseInt(cle, valeur);
                if (n < 1) {
                    throw new IllegalArgumentException("La valeur doit être un entier positif.");
                }
            }
            case "plateforme_maintenance" -> {
                if (!"true".equalsIgnoreCase(valeur) && !"false".equalsIgnoreCase(valeur)) {
                    throw new IllegalArgumentException("Utilisez « true » ou « false ».");
                }
            }
            case "email_support" -> {
                if (!valeur.contains("@")) {
                    throw new IllegalArgumentException("Adresse e-mail invalide.");
                }
            }
            default -> { /* autres clés : texte libre */ }
        }
    }

    private static double parseDouble(String cle, String valeur) {
        try {
            return Double.parseDouble(valeur.replace(',', '.'));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Valeur numérique invalide pour " + cle + ".");
        }
    }

    private static int parseInt(String cle, String valeur) {
        try {
            return Integer.parseInt(valeur.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Valeur entière invalide pour " + cle + ".");
        }
    }

    public ConfigurationResponse update(String cle,
                                        ConfigurationRequest request,
                                        Long adminId) {
        Configuration config = configRepository.findByCle(cle)
                .orElseThrow(() -> new RuntimeException("Configuration introuvable : " + cle));

        String valeur = request.getValeur() != null ? request.getValeur().trim() : "";
        validate(cle, valeur);

        config.setValeur(valeur);
        config.setDescription(request.getDescription());
        config.setUpdatedAt(LocalDateTime.now());
        config = configRepository.save(config);

        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action("MODIFIER_CONFIGURATION")
                .cibleId(config.getId())
                .cibleType("CONFIGURATION")
                .createdAt(LocalDateTime.now())
                .build());

        return toResponse(config);
    }

    private ConfigurationResponse toResponse(Configuration c) {
        return ConfigurationResponse.builder()
                .id(c.getId())
                .cle(c.getCle())
                .valeur(c.getValeur())
                .description(c.getDescription())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}