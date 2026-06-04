package com.example.admin_service.service;

import com.example.admin_service.kafka.event.CategorieEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.Categorie;
import com.example.admin_service.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Keeps categories in db_admin and db_action in sync when created from admin flows.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CategorySyncService {

    private final CategorieRepository categorieRepository;
    private final AdminKafkaProducer kafkaProducer;
    private final RestTemplate restTemplate;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    public String ensureCategoryExists(String rawName, Long adminId) {
        String nom = rawName == null ? "" : rawName.trim();
        if (nom.isEmpty()) {
            throw new IllegalArgumentException("Le nom de catégorie est obligatoire");
        }

        return categorieRepository.findByNomIgnoreCase(nom)
                .map(existing -> {
                    syncToActionDb(
                            existing.getNom(),
                            existing.getDescription(),
                            existing.getImageUrl(),
                            existing.getPublished()
                    );
                    return existing.getNom();
                })
                .orElseGet(() -> createInAdminDb(nom, adminId).getNom());
    }

    private Categorie createInAdminDb(String nom, Long adminId) {
        LocalDateTime now = LocalDateTime.now();
        Categorie categorie = categorieRepository.save(Categorie.builder()
                .nom(nom)
                .description("Catégorie créée depuis l'administration")
                .published(true)
                .createdAt(now)
                .updatedAt(now)
                .build());

        kafkaProducer.publishCategorieCreee(CategorieEvent.builder()
                .nom(categorie.getNom())
                .description(categorie.getDescription())
                .imageUrl(categorie.getImageUrl())
                .published(true)
                .build());

        log.info("Catégorie créée dans db_admin: {}", nom);
        syncToActionDb(categorie.getNom(), categorie.getDescription(), categorie.getImageUrl(), true);
        return categorie;
    }

    public void syncToActionDb(String nom, String description, String imageUrl, Boolean published) {
        Map<String, Object> body = new HashMap<>();
        body.put("nom", nom);
        body.put("description", description);
        body.put("imageUrl", imageUrl);
        body.put("published", published != null ? published : true);

        try {
            restTemplate.postForObject(
                    actionServiceUrl + "/api/categories/admin/ensure",
                    body,
                    Map.class
            );
            log.info("Catégorie synchronisée dans db_action: {}", nom);
        } catch (Exception ex) {
            log.warn("Sync catégorie vers service-action échouée pour '{}': {}", nom, ex.getMessage());
            throw new RuntimeException(
                    "Impossible de synchroniser la catégorie dans db_action. Vérifiez que service-action (9090) est démarré.",
                    ex
            );
        }
    }

    public void deleteFromActionDb(String nom) {
        try {
            restTemplate.delete(
                    actionServiceUrl + "/api/categories/admin/by-name/"
                            + java.net.URLEncoder.encode(nom, java.nio.charset.StandardCharsets.UTF_8)
            );
            log.info("Catégorie supprimée dans db_action: {}", nom);
        } catch (Exception ex) {
            log.warn("Suppression catégorie dans service-action échouée pour '{}': {}", nom, ex.getMessage());
            throw new RuntimeException(
                    "Impossible de supprimer la catégorie dans db_action. Elle est peut-être utilisée par des actions.",
                    ex
            );
        }
    }

}
