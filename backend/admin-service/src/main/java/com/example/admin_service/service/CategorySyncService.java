package com.example.admin_service.service;

import com.example.admin_service.dto.response.ActionDbCategoryResponse;
import com.example.admin_service.dto.response.LinkedActionSummary;
import com.example.admin_service.kafka.event.CategorieEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.Categorie;
import com.example.admin_service.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
                    syncUpdateToActionDb(
                            existing.getNom(),
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
        syncUpdateToActionDb(null, categorie.getNom(), categorie.getDescription(), categorie.getImageUrl(), true);
        return categorie;
    }

    /** Met à jour la catégorie dans db_action (renommage in-place — les actions restent liées par FK). */
    public void syncUpdateToActionDb(
            String previousNom,
            String nom,
            String description,
            String imageUrl,
            Boolean published
    ) {
        Map<String, Object> body = new HashMap<>();
        if (previousNom != null && !previousNom.isBlank()) {
            body.put("previousNom", previousNom.trim());
        }
        body.put("nom", nom);
        body.put("description", description);
        body.put("imageUrl", imageUrl);
        body.put("published", published != null ? published : true);

        try {
            restTemplate.exchange(
                    actionServiceUrl + "/api/categories/admin/sync",
                    HttpMethod.PUT,
                    new HttpEntity<>(body),
                    Map.class
            );
            log.info("Catégorie synchronisée dans db_action: {} → {}", previousNom, nom);
        } catch (Exception ex) {
            log.warn("Sync catégorie vers service-action échouée pour '{}' → '{}': {}",
                    previousNom, nom, ex.getMessage());
            throw new RuntimeException(
                    "Impossible de synchroniser la catégorie dans db_action. Vérifiez que service-action (9090) est démarré.",
                    ex
            );
        }
    }

    /** @deprecated use {@link #syncUpdateToActionDb} */
    public void syncToActionDb(String nom, String description, String imageUrl, Boolean published) {
        syncUpdateToActionDb(null, nom, description, imageUrl, published);
    }

    public long countActionsUsingCategory(String nom) {
        try {
            Map<?, ?> response = restTemplate.getForObject(
                    actionServiceUrl + "/api/categories/admin/by-name/"
                            + java.net.URLEncoder.encode(nom, java.nio.charset.StandardCharsets.UTF_8)
                            + "/usage",
                    Map.class
            );
            if (response != null && response.get("actionCount") instanceof Number count) {
                return count.longValue();
            }
        } catch (Exception ex) {
            log.warn("Impossible de compter les actions pour la catégorie '{}': {}", nom, ex.getMessage());
        }
        return 0;
    }

    public void deleteFromActionDb(String nom) {
        deleteFromActionDb(nom, false);
    }

    public void deleteFromActionDb(String nom, boolean cascade) {
        try {
            String url = actionServiceUrl + "/api/categories/admin/by-name/"
                    + java.net.URLEncoder.encode(nom, java.nio.charset.StandardCharsets.UTF_8);
            if (cascade) {
                url += "?cascade=true";
            }
            restTemplate.delete(url);
            log.info("Catégorie supprimée dans db_action: {} (cascade={})", nom, cascade);
        } catch (Exception ex) {
            log.warn("Suppression catégorie dans service-action échouée pour '{}': {}", nom, ex.getMessage());
            throw new RuntimeException(
                    extractDeleteMessage(ex, nom),
                    ex
            );
        }
    }

    @SuppressWarnings("unchecked")
    public List<ActionDbCategoryResponse> listActionDbCategories() {
        try {
            List<Map<String, Object>> raw = restTemplate.getForObject(
                    actionServiceUrl + "/api/categories/admin/all",
                    List.class
            );
            if (raw == null) {
                return List.of();
            }
            List<ActionDbCategoryResponse> result = new ArrayList<>();
            for (Map<String, Object> item : raw) {
                result.add(mapActionDbCategory(item));
            }
            return result;
        } catch (Exception ex) {
            log.warn("Impossible de lister les catégories db_action: {}", ex.getMessage());
            throw new RuntimeException(
                    "Impossible de charger les catégories depuis db_action. Vérifiez que service-action (9090) est démarré.",
                    ex
            );
        }
    }

    @SuppressWarnings("unchecked")
    public List<LinkedActionSummary> listLinkedActions(String nom) {
        try {
            List<Map<String, Object>> raw = restTemplate.getForObject(
                    actionServiceUrl + "/api/categories/admin/by-name/"
                            + java.net.URLEncoder.encode(nom, java.nio.charset.StandardCharsets.UTF_8)
                            + "/linked-actions",
                    List.class
            );
            if (raw == null) {
                return List.of();
            }
            List<LinkedActionSummary> result = new ArrayList<>();
            for (Map<String, Object> item : raw) {
                result.add(mapLinkedAction(item));
            }
            return result;
        } catch (Exception ex) {
            log.warn("Impossible de lister les actions liées à '{}': {}", nom, ex.getMessage());
            throw new RuntimeException(
                    "Impossible de charger les actions liées à cette catégorie.",
                    ex
            );
        }
    }

    private static ActionDbCategoryResponse mapActionDbCategory(Map<String, Object> item) {
        return ActionDbCategoryResponse.builder()
                .id(toLong(item.get("id")))
                .name(stringValue(item.get("name")))
                .description(stringValue(item.get("description")))
                .imageUrl(stringValue(item.get("imageUrl")))
                .published(toBoolean(item.get("published")))
                .actionCount(toLong(item.get("actionCount")))
                .build();
    }

    private static LinkedActionSummary mapLinkedAction(Map<String, Object> item) {
        return LinkedActionSummary.builder()
                .id(toLong(item.get("id")))
                .title(stringValue(item.get("title")))
                .status(stringValue(item.get("status")))
                .city(stringValue(item.get("city")))
                .associationName(stringValue(item.get("associationName")))
                .isFixed(toBoolean(item.get("isFixed")))
                .build();
    }

    private static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private static Boolean toBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value != null) {
            return Boolean.parseBoolean(value.toString());
        }
        return null;
    }

    private static String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    @Async
    public void syncUpdateToActionDbAsync(
            String previousNom,
            String nom,
            String description,
            String imageUrl,
            Boolean published
    ) {
        try {
            syncUpdateToActionDb(previousNom, nom, description, imageUrl, published);
        } catch (Exception ex) {
            log.error("Sync catégorie async échouée {} → {}: {}", previousNom, nom, ex.getMessage());
        }
    }

    private static String extractDeleteMessage(Exception ex, String nom) {
        String msg = ex.getMessage();
        if (msg != null && msg.contains("action")) {
            return msg;
        }
        return "Impossible de supprimer « " + nom + " » dans db_action. "
                + "Des actions utilisent peut-être cette catégorie.";
    }
}
