package com.example.admin_service.service;


import com.example.admin_service.dto.request.CategorieRequest;
import com.example.admin_service.dto.response.ActionDbCategoryResponse;
import com.example.admin_service.dto.response.CategorieResponse;
import com.example.admin_service.dto.response.CategoryDeletePreviewResponse;
import com.example.admin_service.dto.response.LinkedActionSummary;
import com.example.admin_service.kafka.event.CategorieEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.Categorie;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.CategorieRepository;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCategorieService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final CategorieRepository categorieRepository;
    private final CategorySyncService categorySyncService;

    public List<CategorieResponse> getAll() {
        return categorieRepository.findAllByOrderByNomAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void create(CategorieRequest request, Long adminId) {
        String nom = request.getNom() == null ? "" : request.getNom().trim();
        if (nom.isEmpty()) {
            throw new IllegalArgumentException("Le nom de catégorie est obligatoire");
        }
        if (categorieRepository.existsByNomIgnoreCase(nom)) {
            throw new RuntimeException("Catégorie déjà existante: " + nom);
        }

        boolean published = request.getPublished() == null || request.getPublished();
        LocalDateTime now = LocalDateTime.now();
        Categorie categorie = categorieRepository.save(Categorie.builder()
                .nom(nom)
                .description(trimOrNull(request.getDescription()))
                .imageUrl(trimOrNull(request.getImageUrl()))
                .published(published)
                .createdAt(now)
                .updatedAt(now)
                .build());

        publishCreated(categorie);
        categorySyncService.syncUpdateToActionDb(
                null,
                categorie.getNom(),
                categorie.getDescription(),
                categorie.getImageUrl(),
                categorie.getPublished()
        );
        saveLog(adminId, "CREER_CATEGORIE", categorie.getId(), "CATEGORIE");
    }

    @Transactional
    public void update(Long id, CategorieRequest request, Long adminId) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable: " + id));

        String previousNom = categorie.getNom();
        String nom = request.getNom() == null ? "" : request.getNom().trim();
        if (nom.isEmpty()) {
            throw new IllegalArgumentException("Le nom de catégorie est obligatoire");
        }
        if (!nom.equalsIgnoreCase(categorie.getNom())
                && categorieRepository.existsByNomIgnoreCase(nom)) {
            throw new RuntimeException("Catégorie déjà existante: " + nom);
        }

        categorie.setNom(nom);
        categorie.setDescription(trimOrNull(request.getDescription()));
        categorie.setImageUrl(trimOrNull(request.getImageUrl()));
        if (request.getPublished() != null) {
            categorie.setPublished(request.getPublished());
        }
        categorie.setUpdatedAt(LocalDateTime.now());
        categorie = categorieRepository.save(categorie);

        publishModified(categorie, previousNom);
        categorySyncService.syncUpdateToActionDb(
                previousNom,
                categorie.getNom(),
                categorie.getDescription(),
                categorie.getImageUrl(),
                categorie.getPublished()
        );
        saveLog(adminId, "MODIFIER_CATEGORIE", id, "CATEGORIE");
    }

    @Transactional
    public void setPublished(Long id, boolean published, Long adminId) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable: " + id));
        categorie.setPublished(published);
        categorie.setUpdatedAt(LocalDateTime.now());
        categorie = categorieRepository.save(categorie);

        publishModified(categorie, null);
        categorySyncService.syncUpdateToActionDb(
                categorie.getNom(),
                categorie.getNom(),
                categorie.getDescription(),
                categorie.getImageUrl(),
                categorie.getPublished()
        );
        saveLog(adminId, published ? "PUBLIER_CATEGORIE" : "DEPUBLIER_CATEGORIE", id, "CATEGORIE");
    }

    @Transactional
    public void delete(Long id, Long adminId) {
        delete(id, adminId, false);
    }

    @Transactional
    public void delete(Long id, Long adminId, boolean cascade) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable: " + id));

        if (!cascade) {
            long usage = categorySyncService.countActionsUsingCategory(categorie.getNom());
            if (usage > 0) {
                throw new RuntimeException(
                        "Impossible de supprimer « " + categorie.getNom() + " » : "
                                + usage + " action(s) utilisent cette catégorie."
                );
            }
        }

        categorySyncService.deleteFromActionDb(categorie.getNom(), cascade);
        categorieRepository.delete(categorie);
        saveLog(adminId, "SUPPRIMER_CATEGORIE", id, "CATEGORIE");
        log.info("Catégorie supprimée: {} (cascade={})", categorie.getNom(), cascade);
    }

    public List<ActionDbCategoryResponse> getActionDbCategories() {
        return categorySyncService.listActionDbCategories();
    }

    public CategoryDeletePreviewResponse getDeletePreview(Long id) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable: " + id));
        List<LinkedActionSummary> linked = categorySyncService.listLinkedActions(categorie.getNom());
        return CategoryDeletePreviewResponse.builder()
                .id(categorie.getId())
                .nom(categorie.getNom())
                .actionCount(linked.size())
                .linkedActions(linked)
                .build();
    }

    private void publishCreated(Categorie categorie) {
        kafkaProducer.publishCategorieCreee(CategorieEvent.builder()
                .nom(categorie.getNom())
                .description(categorie.getDescription())
                .imageUrl(categorie.getImageUrl())
                .published(categorie.getPublished())
                .build());
    }

    private void publishModified(Categorie categorie, String previousNom) {
        kafkaProducer.publishCategorieModifiee(CategorieEvent.builder()
                .nom(categorie.getNom())
                .previousNom(previousNom)
                .description(categorie.getDescription())
                .imageUrl(categorie.getImageUrl())
                .published(categorie.getPublished())
                .build());
    }

    private CategorieResponse toResponse(Categorie categorie) {
        return CategorieResponse.builder()
                .id(categorie.getId())
                .nom(categorie.getNom())
                .description(categorie.getDescription())
                .imageUrl(categorie.getImageUrl())
                .published(categorie.getPublished())
                .updatedAt(categorie.getUpdatedAt())
                .build();
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void saveLog(Long adminId, String action,
                         Long cibleId, String cibleType) {
        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action(action)
                .cibleId(cibleId)
                .cibleType(cibleType)
                .createdAt(LocalDateTime.now())
                .build());
    }
}
