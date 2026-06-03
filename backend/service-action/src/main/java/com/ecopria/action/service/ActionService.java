package com.ecopria.action.service;

import com.ecopria.action.dto.*;
import com.ecopria.action.kafka.ActionProducer;
import com.ecopria.action.kafka.event.*;
import com.ecopria.action.model.*;
import com.ecopria.action.model.Action.ActionStatus;
import com.ecopria.action.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActionService {

    private final ActionRepository actionRepository;
    private final AssociationRepository associationRepository;
    private final CategorieRepository categorieRepository;
    private final ActionProducer actionProducer;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:9090}")
    private String baseUrl;

    // ─── LISTE PUBLIQUE ───────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ActionSummaryDTO> getAllPublished(Long categoryId) {
        List<Action> actions;
        if (categoryId != null) {
            actions = actionRepository.findByCategoryIdAndStatus(categoryId, ActionStatus.PUBLISHED);
        } else {
            actions = actionRepository.findByStatus(ActionStatus.PUBLISHED);
        }
        return actions.stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    // ─── DÉTAIL ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ActionDetailDTO getDetail(Long actionId, Long userId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée"));

        // Sécurité : Un brouillon ne peut être vu que par l'association qui l'a créé
        if (action.getStatus() == Action.ActionStatus.DRAFT) {
            if (userId == null || action.getAssociation() == null || !action.getAssociation().getUserId().equals(userId)) {
                throw new RuntimeException("Accès interdit : Cette action n'est pas encore publiée.");
            }
        }

        return toDetailDTO(action);
    }

    // ─── CARTE ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ActionSummaryDTO> getForMap(Long categoryId) {
        List<Action> actions;
        if (categoryId != null) {
            actions = actionRepository.findByCategoryForMap(categoryId);
        } else {
            actions = actionRepository.findAllForMap();
        }
        return actions.stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    // ─── DISPONIBILITÉ — appelé par service-inscription ───────

    @Transactional(readOnly = true)
    public ActionAvailabilityDTO getAvailability(Long actionId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée"));

        return ActionAvailabilityDTO.builder()
                .actionId(actionId)
                .availablePlaces(action.getAvailablePlaces())
                .maxParticipants(action.getMaxParticipants())
                .points(action.getPoints())
                .status(action.getStatus())
                .hasAvailablePlaces(action.getAvailablePlaces() > 0)
                .build();
    }

    // ─── CRÉER ────────────────────────────────────────────────

    @Transactional
    public ActionDetailDTO create(CreateActionDTO dto, Long userId) {
        Association association = associationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Association assoc = Association.builder()
                            .userId(userId)
                            .name("Association")
                            .build();
                    log.info("Association par défaut créée pour userId: {}", userId);
                    return associationRepository.save(assoc);
                });

        Categorie category = categorieRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée"));

        Action action = Action.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(category)
                .association(association)
                .address(dto.getAddress())
                .city(dto.getCity())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .dateStart(dto.getDateStart())
                .dateEnd(dto.getDateEnd())
                .points(dto.getPoints())
                .maxParticipants(dto.getMaxParticipants())
                .availablePlaces(dto.getMaxParticipants())
                .program(dto.getProgram() != null ? dto.getProgram() : List.of())
                .practicalInfos(dto.getPracticalInfos() != null ? dto.getPracticalInfos() : List.of())
                .status(ActionStatus.DRAFT)
                .isFixed(false)
                .build();

        Action saved = actionRepository.save(action);
        log.info("Action créée en DRAFT id: {}", saved.getId());
        return toDetailDTO(saved);
    }

    // ─── PUBLIER ──────────────────────────────────────────────

    @Transactional
    public ActionDetailDTO publish(Long actionId, Long userId) {
        Action action = getActionOwnedByUser(actionId, userId);

        if (action.getStatus() != ActionStatus.DRAFT) {
            throw new RuntimeException("Seul un brouillon peut être publié");
        }

        action.setStatus(ActionStatus.PUBLISHED);
        Action saved = actionRepository.save(action);

        // publier sur Kafka → service-notification
        actionProducer.publishActionCreated(ActionCreatedEvent.builder()
                .actionId(saved.getId())
                .title(saved.getTitle())
                .category(saved.getCategory().getName())
                .city(saved.getCity())
                .latitude(saved.getLatitude())
                .longitude(saved.getLongitude())
                .dateStart(saved.getDateStart())
                .points(saved.getPoints())
                .maxParticipants(saved.getMaxParticipants())
                .build());

        log.info("Action publiée id: {}", saved.getId());
        return toDetailDTO(saved);
    }

    // ─── MODIFIER ─────────────────────────────────────────────

    @Transactional
    public ActionDetailDTO update(Long actionId, UpdateActionDTO dto, Long userId) {
        Action action = getActionOwnedByUser(actionId, userId);

        if (action.getStatus() == ActionStatus.CANCELLED ||
                action.getStatus() == ActionStatus.COMPLETED) {
            throw new RuntimeException("Cette action ne peut plus être modifiée");
        }

        if (dto.getTitle() != null)
            action.setTitle(dto.getTitle());
        if (dto.getDescription() != null)
            action.setDescription(dto.getDescription());
        if (dto.getAddress() != null)
            action.setAddress(dto.getAddress());
        if (dto.getCity() != null)
            action.setCity(dto.getCity());
        if (dto.getLatitude() != null)
            action.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null)
            action.setLongitude(dto.getLongitude());
        if (dto.getDateStart() != null)
            action.setDateStart(dto.getDateStart());
        if (dto.getDateEnd() != null)
            action.setDateEnd(dto.getDateEnd());
        if (dto.getPoints() != null)
            action.setPoints(dto.getPoints());
        if (dto.getProgram() != null)
            action.setProgram(dto.getProgram());
        if (dto.getPracticalInfos() != null)
            action.setPracticalInfos(dto.getPracticalInfos());

        return toDetailDTO(actionRepository.save(action));
    }

    // ─── ANNULER ──────────────────────────────────────────────

    @Transactional
    public void cancel(Long actionId, Long userId, String reason) {
        Action action = getActionOwnedByUser(actionId, userId);

        if (action.getStatus() == ActionStatus.CANCELLED ||
                action.getStatus() == ActionStatus.COMPLETED) {
            throw new RuntimeException("Cette action ne peut pas être annulée");
        }

        action.setStatus(ActionStatus.CANCELLED);
        actionRepository.save(action);

        // publier sur Kafka → service-notification
        actionProducer.publishActionCancelled(ActionCancelledEvent.builder()
                .actionId(actionId)
                .title(action.getTitle())
                .cancellationReason(reason)
                .build());

        log.info("Action annulée id: {}", actionId);
    }

    // ─── DASHBOARD ASSOCIATION ────────────────────────────────

    @Transactional(readOnly = false) // changed to false to allow saving
    public List<ActionSummaryDTO> getMyActions(Long userId) {
        Association association = associationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Association assoc = Association.builder()
                            .userId(userId)
                            .name("Association")
                            .build();
                    return associationRepository.save(assoc);
                });
        return actionRepository.findByAssociationId(association.getId())
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = false) // changed to false to allow saving
    public AssociationStatsDTO getMyStats(Long userId) {
        Association association = associationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Association assoc = Association.builder()
                            .userId(userId)
                            .name("Association")
                            .build();
                    return associationRepository.save(assoc);
                });
                
        List<Action> actions = actionRepository.findByAssociationId(association.getId());
        
        int totalActions = actions.size();
        int totalPublished = (int) actions.stream()
                .filter(a -> a.getStatus() == ActionStatus.PUBLISHED || a.getStatus() == ActionStatus.COMPLETED)
                .count();
        int totalParticipants = actions.stream().mapToInt(Action::getRegisteredCount).sum();
        int totalPlaces = actions.stream().mapToInt(Action::getMaxParticipants).sum();
        int totalPoints = actions.stream().mapToInt(a -> a.getPoints() * a.getRegisteredCount()).sum();
        
        return AssociationStatsDTO.builder()
                .totalActions(totalActions)
                .totalPublished(totalPublished)
                .totalParticipants(totalParticipants)
                .totalPlaces(totalPlaces)
                .totalPoints(totalPoints)
                .build();
    }

    /** Actions publiées d'une association (page publique /api/associations/{id}/actions). */
    @Transactional(readOnly = true)
    public List<ActionSummaryDTO> getPublishedActionsByAssociationId(Long associationId) {
        if (!associationRepository.existsById(associationId)) {
            throw new RuntimeException("Association non trouvée : id=" + associationId);
        }
        return actionRepository.findByAssociationIdAndStatus(associationId, ActionStatus.PUBLISHED)
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = false) // changed to false to allow saving
    public List<ActionSummaryDTO> getMyDrafts(Long userId) {
        Association association = associationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Association assoc = Association.builder()
                            .userId(userId)
                            .name("Association")
                            .build();
                    return associationRepository.save(assoc);
                });
        return actionRepository.findByAssociationIdAndStatus(association.getId(), ActionStatus.DRAFT)
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    // ─── LIBÉRER / DÉCRÉMENTER PLACE via Kafka ────────────────

    @Transactional
    public void releasePlace(Long actionId) {
        actionRepository.findById(actionId).ifPresent(action -> {
            if (action.getAvailablePlaces() < action.getMaxParticipants()) {
                action.setAvailablePlaces(action.getAvailablePlaces() + 1);
                actionRepository.save(action);
                publishPlacesUpdated(action);
            }
        });
    }

    @Transactional
    public void decrementPlace(Long actionId) {
        actionRepository.findById(actionId).ifPresent(action -> {
            if (action.getAvailablePlaces() > 0) {
                action.setAvailablePlaces(action.getAvailablePlaces() - 1);
                actionRepository.save(action);
                publishPlacesUpdated(action);
            }
        });
    }

    // ─── ACTIONS FIXES via Kafka ──────────────────────────────

    @Transactional
    public void createFixedAction(Map<String, Object> event) {
        String categoryName = event.get("categorie").toString();
        Categorie category = categorieRepository.findByName(categoryName)
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée: " + categoryName));

        Long actionFixeId = event.containsKey("actionFixeId") ? Long.valueOf(event.get("actionFixeId").toString())
                : (event.containsKey("id") ? Long.valueOf(event.get("id").toString()) : null);

        Action action = Action.builder()
                .title(event.get("titre").toString())
                .city(event.get("lieu") != null ? event.get("lieu").toString() : "")
                .latitude(Double.valueOf(event.get("latitude").toString()))
                .longitude(Double.valueOf(event.get("longitude").toString()))
                .points(Integer.valueOf(event.get("points").toString()))
                .maxParticipants(Integer.valueOf(event.get("placesTotal").toString()))
                .availablePlaces(Integer.valueOf(event.get("placesTotal").toString()))
                .category(category)
                .isFixed(true)
                .actionFixeId(actionFixeId)
                .status(ActionStatus.PUBLISHED)
                .build();

        actionRepository.save(action);
        log.info("Action fixe créée: {}", event.get("titre"));
    }

    @Transactional
    public void updateFixedAction(Map<String, Object> event) {
        Long actionFixeId = event.containsKey("actionFixeId") ? Long.valueOf(event.get("actionFixeId").toString())
                : (event.containsKey("id") ? Long.valueOf(event.get("id").toString()) : null);

        if (actionFixeId == null) {
            log.warn("Impossible de mettre à jour l'action fixe, ID manquant: {}", event);
            return;
        }

        actionRepository.findByActionFixeId(actionFixeId).ifPresent(action -> {
            if (event.containsKey("titre"))
                action.setTitle(event.get("titre").toString());
            if (event.containsKey("lieu"))
                action.setCity(event.get("lieu").toString());
            if (event.containsKey("latitude"))
                action.setLatitude(Double.valueOf(event.get("latitude").toString()));
            if (event.containsKey("longitude"))
                action.setLongitude(Double.valueOf(event.get("longitude").toString()));
            if (event.containsKey("points"))
                action.setPoints(Integer.valueOf(event.get("points").toString()));
            if (event.containsKey("placesTotal")) {
                Integer newMax = Integer.valueOf(event.get("placesTotal").toString());
                int diff = newMax - action.getMaxParticipants();
                action.setMaxParticipants(newMax);
                action.setAvailablePlaces(Math.max(0, action.getAvailablePlaces() + diff));
            }
            actionRepository.save(action);
            log.info("Action fixe mise à jour: {}", action.getTitle());
        });
    }

    @Transactional
    public void deactivateFixedAction(Map<String, Object> event) {
        Long actionFixeId = event.containsKey("actionFixeId") ? Long.valueOf(event.get("actionFixeId").toString())
                : (event.containsKey("id") ? Long.valueOf(event.get("id").toString()) : null);

        if (actionFixeId == null) {
            log.warn("Impossible de désactiver l'action fixe, ID manquant: {}", event);
            return;
        }

        actionRepository.findByActionFixeId(actionFixeId).ifPresent(action -> {
            if (action.getStatus() != ActionStatus.CANCELLED && action.getStatus() != ActionStatus.COMPLETED) {
                action.setStatus(ActionStatus.CANCELLED);
                actionRepository.save(action);
                log.info("Action fixe désactivée: {}", action.getTitle());

                actionProducer.publishActionCancelled(ActionCancelledEvent.builder()
                        .actionId(action.getId())
                        .title(action.getTitle())
                        .cancellationReason("Annulée par l'administrateur")
                        .build());
            }
        });
    }

    // ─── ADMIN ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ActionSummaryDTO> getAllForAdmin() {
        return actionRepository.findAll().stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    // ─── CRON — terminer les actions passées ──────────────────

    @Scheduled(cron = "0 0 2 * * *") // tous les jours à 2h du matin
    @Transactional
    public void completeExpiredActions() {
        List<Action> expired = actionRepository.findByStatusAndDateEndBefore(
                ActionStatus.PUBLISHED, LocalDateTime.now());
        expired.forEach(action -> {
            action.setStatus(ActionStatus.COMPLETED);
            log.info("Action terminée automatiquement id: {}", action.getId());
        });
        actionRepository.saveAll(expired);
    }

    // ─── MÉTHODES PRIVÉES ─────────────────────────────────────

    private void publishPlacesUpdated(Action action) {
        actionProducer.publishActionPlacesUpdated(ActionPlacesUpdatedEvent.builder()
                .actionId(action.getId())
                .availablePlaces(action.getAvailablePlaces())
                .maxParticipants(action.getMaxParticipants())
                .build());
    }

    private Action getActionOwnedByUser(Long actionId, Long userId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée"));
        Association association = associationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Association assoc = Association.builder()
                            .userId(userId)
                            .name("Association")
                            .build();
                    return associationRepository.save(assoc);
                });
        if (!action.getAssociation().getId().equals(association.getId())) {
            throw new RuntimeException("Vous n'êtes pas le propriétaire de cette action");
        }
        return action;
    }

    private ActionSummaryDTO toSummaryDTO(Action action) {
        return ActionSummaryDTO.builder()
                .id(action.getId())
                .title(action.getTitle())
                .categoryName(action.getCategory().getName())
                .categoryImageUrl(action.getCategory().getImageUrl())
                .city(action.getCity())
                .latitude(action.getLatitude())
                .longitude(action.getLongitude())
                .dateStart(action.getDateStart())
                .dateEnd(action.getDateEnd())
                .points(action.getPoints())
                .availablePlaces(action.getAvailablePlaces())
                .maxParticipants(action.getMaxParticipants())
                .registeredCount(action.getRegisteredCount())
                .isFixed(action.getIsFixed())
                .status(action.getStatus())
                .photoUrls(action.getPhotos().stream()
                        .map(photo -> photo.getUrl())
                        .collect(Collectors.toList()))
                .build();
    }

    private ActionDetailDTO toDetailDTO(Action action) {
        return ActionDetailDTO.builder()
                .id(action.getId())
                .title(action.getTitle())
                .description(action.getDescription())
                .categoryName(action.getCategory().getName())
                .address(action.getAddress())
                .city(action.getCity())
                .latitude(action.getLatitude())
                .longitude(action.getLongitude())
                .dateStart(action.getDateStart())
                .dateEnd(action.getDateEnd())
                .points(action.getPoints())
                .availablePlaces(action.getAvailablePlaces())
                .maxParticipants(action.getMaxParticipants())
                .registeredCount(action.getRegisteredCount())
                .isFixed(action.getIsFixed())
                .status(action.getStatus())
                .program(action.getProgram())
                .practicalInfos(action.getPracticalInfos())
                .photoUrls(action.getPhotos().stream()
                        .map(ActionPhoto::getUrl)
                        .collect(Collectors.toList()))
                .associationId(action.getAssociation() != null ? action.getAssociation().getId() : null)
                .associationName(action.getAssociation() != null ? action.getAssociation().getName() : null)
                .associationDescription(action.getAssociation() != null ? action.getAssociation().getDescription() : null)
                .associationLogoUrl(action.getAssociation() != null ? action.getAssociation().getLogoUrl() : null)
                .associationCity(action.getAssociation() != null ? action.getAssociation().getCity() : null)
                .build();
    }

    // ─── SYNCHRONISATION CATÉGORIES ───────────────────────────

    @Transactional
    public void saveCategorie(Categorie categorie) {
        categorieRepository.save(categorie);
        log.info("Catégorie sauvegardée en local: {}", categorie.getName());
    }

    @Transactional
    public void updateCategorie(String name, Map<String, Object> event) {
        categorieRepository.findByName(name).ifPresent(cat -> {
            if (event.containsKey("description"))
                cat.setDescription(event.get("description").toString());
            if (event.containsKey("imageUrl"))
                cat.setImageUrl(event.get("imageUrl").toString());
            categorieRepository.save(cat);
            log.info("Catégorie mise à jour en local: {}", name);
        });
    }

    // ─── UPLOAD PHOTO ─────────────────────────────────────────

    @Transactional
    public String uploadPhoto(Long actionId, MultipartFile photo, Long userId) {
        // Vérifier que l'action appartient à l'utilisateur
        Action action = getActionOwnedByUser(actionId, userId);

        // Valider le fichier
        if (photo.isEmpty()) {
            throw new RuntimeException("Le fichier photo est vide");
        }

        String contentType = photo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Le fichier doit être une image");
        }

        // Valider la taille (5 MB max)
        if (photo.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("La photo ne peut pas dépasser 5 Mo");
        }

        try {
            // Créer le dossier d'upload s'il n'existe pas
            Path uploadPath = Paths.get(uploadDir, "actions");
            Files.createDirectories(uploadPath);

            // Générer un nom de fichier unique
            String originalFilename = photo.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = "action_" + actionId + "_" + UUID.randomUUID().toString() + extension;

            // Sauvegarder le fichier
            Path filePath = uploadPath.resolve(filename);
            Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Construire l'URL publique
            String photoUrl = baseUrl + "/uploads/actions/" + filename;

            // Supprimer l'ancienne photo s'il y en a une
            action.getPhotos().clear();

            // Créer et sauvegarder la nouvelle photo
            ActionPhoto actionPhoto = ActionPhoto.builder()
                    .action(action)
                    .url(photoUrl)
                    .filename(filename)
                    .build();

            action.getPhotos().add(actionPhoto);
            actionRepository.save(action);

            log.info("Photo uploadée pour l'action {}: {}", actionId, filename);
            return photoUrl;

        } catch (IOException e) {
            log.error("Erreur lors de l'upload de la photo pour l'action {}", actionId, e);
            throw new RuntimeException("Erreur lors de l'upload de la photo: " + e.getMessage());
        }
    }
}