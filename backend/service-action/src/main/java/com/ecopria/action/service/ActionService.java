package com.ecopria.action.service;

import com.ecopria.action.client.PresenceClient;
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
import java.util.Collections;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActionService {

    private final ActionRepository actionRepository;
    private final AssociationRepository associationRepository;
    private final CategorieRepository categorieRepository;
    private final ActionPhotoRepository actionPhotoRepository;
    private final ActionProducer actionProducer;
    private final PresenceClient presenceClient;

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

        ActionDetailDTO detail = toDetailDTO(action);
        detail.setPointsCredited(presenceClient.pointsForAction(actionId));
        return detail;
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
        if (dto.getMaxParticipants() != null) {
            int inscrits = action.getRegisteredCount();
            int newMax = dto.getMaxParticipants();
            if (newMax < inscrits) {
                throw new IllegalArgumentException(
                        "Le nombre max de participants ne peut pas être inférieur aux inscrits (" + inscrits + ")");
            }
            action.setMaxParticipants(newMax);
            action.setAvailablePlaces(newMax - inscrits);
        }
        if (dto.getCategoryId() != null) {
            Categorie category = categorieRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Catégorie non trouvée"));
            action.setCategory(category);
        }
        if (dto.getProgram() != null)
            action.setProgram(dto.getProgram());
        if (dto.getPracticalInfos() != null)
            action.setPracticalInfos(dto.getPracticalInfos());

        Action saved = actionRepository.save(action);
        publishPlacesUpdated(saved);
        return toDetailDTO(saved);
    }

    // ─── ANNULER ──────────────────────────────────────────────

    @Transactional
    public void cancel(Long actionId, Long userId, String reason) {
        Action action = getActionOwnedByUser(actionId, userId);

        if (action.getStatus() == ActionStatus.CANCELLED ||
                action.getStatus() == ActionStatus.COMPLETED) {
            throw new RuntimeException("Cette action ne peut pas être annulée");
        }

        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Le motif d'annulation est obligatoire");
        }

        action.setStatus(ActionStatus.CANCELLED);
        actionRepository.save(action);

        actionProducer.publishActionCancelled(ActionCancelledEvent.builder()
                .actionId(actionId)
                .title(action.getTitle())
                .cancellationReason(reason.trim())
                .city(action.getCity())
                .address(action.getAddress())
                .dateStart(action.getDateStart())
                .associationName(action.getAssociation() != null ? action.getAssociation().getName() : null)
                .build());

        log.info("Action annulée id: {} — motif: {}", actionId, reason.trim());
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
        List<Action> actions = actionRepository.findByAssociationId(association.getId());
        return enrichSummariesWithPointsCredited(actions);
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
        List<Long> actionIds = actions.stream().map(Action::getId).toList();
        int totalPoints = presenceClient.sumPointsForActions(actionIds);
        
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

        int templatePlaces = 999;
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        Association platformAssociation = resolvePlatformAssociation();

        Action action = Action.builder()
                .title(event.get("titre").toString())
                .description(event.containsKey("description") && event.get("description") != null
                        ? event.get("description").toString()
                        : null)
                .address("Template Ecopria")
                .city("Plateforme")
                .latitude(33.5731)
                .longitude(-7.5898)
                .dateStart(start)
                .dateEnd(start.plusYears(1))
                .points(Integer.valueOf(event.get("points").toString()))
                .maxParticipants(templatePlaces)
                .availablePlaces(templatePlaces)
                .category(category)
                .association(platformAssociation)
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
            if (event.containsKey("titre")) {
                action.setTitle(event.get("titre").toString());
            }
            if (event.containsKey("description") && event.get("description") != null) {
                action.setDescription(event.get("description").toString());
            }
            if (event.containsKey("points")) {
                action.setPoints(Integer.valueOf(event.get("points").toString()));
            }
            actionRepository.save(action);
            log.info("Action fixe mise à jour: {}", action.getTitle());
        });
    }

    @Transactional
    public void activateFixedAction(Map<String, Object> event) {
        Long actionFixeId = event.containsKey("actionFixeId") ? Long.valueOf(event.get("actionFixeId").toString())
                : (event.containsKey("id") ? Long.valueOf(event.get("id").toString()) : null);

        if (actionFixeId == null) {
            log.warn("Impossible de réactiver l'action fixe, ID manquant: {}", event);
            return;
        }

        actionRepository.findByActionFixeId(actionFixeId).ifPresent(action -> {
            if (action.getStatus() == ActionStatus.CANCELLED) {
                action.setStatus(ActionStatus.PUBLISHED);
                actionRepository.save(action);
                log.info("Action fixe réactivée: {}", action.getTitle());
            }
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
                        .city(action.getCity())
                        .address(action.getAddress())
                        .dateStart(action.getDateStart())
                        .associationName(action.getAssociation() != null ? action.getAssociation().getName() : null)
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

    @Transactional(readOnly = true)
    public List<ActionSummaryDTO> getNonFixedForAdmin() {
        return actionRepository.findAll().stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsFixed()))
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActionDetailDTO getAdminNonFixedDetail(Long actionId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée: " + actionId));
        if (Boolean.TRUE.equals(action.getIsFixed())) {
            throw new RuntimeException("Action fixe — utilisez admin-service actions-fixes");
        }
        return toDetailDTO(action);
    }

    @Transactional
    public ActionDetailDTO adminCreateNonFixedAction(AdminActionManageRequest request) {
        Categorie category = resolveCategoryForAdmin(request.getCategorie());
        Association association = resolveAssociationForAdmin(request.getAssociationId(), request.getAssociationName());

        LocalDateTime start = parseDateTime(request.getDateStart(), LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0));
        LocalDateTime end = parseDateTime(request.getDateEnd(), start.plusHours(2));
        if (end.isBefore(start)) {
            end = start.plusHours(2);
        }
        int max = request.getPlacesTotal() != null && request.getPlacesTotal() > 0 ? request.getPlacesTotal() : 20;
        String address = resolveAddress(request);
        String city = resolveCity(request);

        Action action = Action.builder()
                .title(request.getTitre())
                .description(request.getDescription())
                .category(category)
                .association(association)
                .address(address)
                .city(city)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .dateStart(start)
                .dateEnd(end)
                .points(request.getPoints())
                .maxParticipants(max)
                .availablePlaces(max)
                .program(request.getProgram() != null ? new ArrayList<>(request.getProgram()) : new ArrayList<>())
                .practicalInfos(request.getPracticalInfos() != null ? new ArrayList<>(request.getPracticalInfos()) : new ArrayList<>())
                .status(ActionStatus.PUBLISHED)
                .isFixed(false)
                .build();
        return toDetailDTO(actionRepository.save(action));
    }

    @Transactional
    public ActionDetailDTO adminUpdateNonFixedAction(Long actionId, AdminActionManageRequest request) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée: " + actionId));
        if (Boolean.TRUE.equals(action.getIsFixed())) {
            throw new RuntimeException("Action fixe non modifiable via cet endpoint");
        }
        Categorie category = resolveCategoryForAdmin(request.getCategorie());
        Association association = resolveAssociationForAdmin(request.getAssociationId(), request.getAssociationName());

        action.setTitle(request.getTitre());
        action.setDescription(request.getDescription());
        action.setCategory(category);
        action.setAssociation(association);
        action.setAddress(resolveAddress(request));
        action.setCity(resolveCity(request));
        action.setLatitude(request.getLatitude());
        action.setLongitude(request.getLongitude());
        if (request.getDateStart() != null && !request.getDateStart().isBlank()) {
            action.setDateStart(parseDateTime(request.getDateStart(), action.getDateStart()));
        }
        if (request.getDateEnd() != null && !request.getDateEnd().isBlank()) {
            action.setDateEnd(parseDateTime(request.getDateEnd(), action.getDateEnd()));
        }
        action.setPoints(request.getPoints());
        if (request.getPlacesTotal() != null && request.getPlacesTotal() > 0) {
            int diff = request.getPlacesTotal() - action.getMaxParticipants();
            action.setMaxParticipants(request.getPlacesTotal());
            action.setAvailablePlaces(Math.max(0, action.getAvailablePlaces() + diff));
        }
        if (request.getProgram() != null) {
            action.setProgram(new ArrayList<>(request.getProgram()));
        }
        if (request.getPracticalInfos() != null) {
            action.setPracticalInfos(new ArrayList<>(request.getPracticalInfos()));
        }
        return toDetailDTO(actionRepository.save(action));
    }

    @Transactional
    public String adminUploadPhoto(Long actionId, MultipartFile photo) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée: " + actionId));
        if (Boolean.TRUE.equals(action.getIsFixed())) {
            throw new RuntimeException("Upload photo réservé aux actions non fixes");
        }
        return storeActionPhoto(action, photo);
    }

    private static String resolveAddress(AdminActionManageRequest request) {
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            return request.getAddress().trim();
        }
        if (request.getLieu() != null && !request.getLieu().isBlank()) {
            return request.getLieu().trim();
        }
        return "Adresse non définie";
    }

    private static String resolveCity(AdminActionManageRequest request) {
        if (request.getCity() != null && !request.getCity().isBlank()) {
            return request.getCity().trim();
        }
        if (request.getLieu() != null && !request.getLieu().isBlank()) {
            return request.getLieu().trim();
        }
        return "Ville non définie";
    }

    private static final DateTimeFormatter[] DATE_PARSERS = {
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
    };

    private static LocalDateTime parseDateTime(String value, LocalDateTime fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String trimmed = value.trim();
        for (DateTimeFormatter formatter : DATE_PARSERS) {
            try {
                return LocalDateTime.parse(trimmed, formatter);
            } catch (DateTimeParseException ignored) {
                // try next
            }
        }
        throw new RuntimeException("Format de date invalide : " + value);
    }

    @Transactional
    public void adminActivateNonFixedAction(Long actionId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée: " + actionId));
        if (Boolean.TRUE.equals(action.getIsFixed())) {
            throw new RuntimeException("Action fixe non modifiable via cet endpoint");
        }
        if (action.getStatus() == ActionStatus.COMPLETED) {
            throw new RuntimeException("Impossible d'activer une action complétée");
        }
        action.setStatus(ActionStatus.PUBLISHED);
        actionRepository.save(action);
    }

    @Transactional
    public void adminDeactivateNonFixedAction(Long actionId) {
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action non trouvée: " + actionId));
        if (Boolean.TRUE.equals(action.getIsFixed())) {
            throw new RuntimeException("Action fixe non modifiable via cet endpoint");
        }
        if (action.getStatus() == ActionStatus.COMPLETED) {
            throw new RuntimeException("Impossible de désactiver une action complétée");
        }
        action.setStatus(ActionStatus.CANCELLED);
        actionRepository.save(action);
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

    private Categorie resolveCategoryForAdmin(String categorieName) {
        return ensureCategoryExists(categorieName, null, null);
    }

    private Association resolvePlatformAssociation() {
        return associationRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> associationRepository.save(Association.builder()
                        .userId(0L)
                        .name("Ecopria Platform")
                        .city("Plateforme")
                        .description("Association technique pour les actions fixes")
                        .build()));
    }

    private Association resolveAssociationForAdmin(Long associationOrUserId, String associationName) {
        return associationRepository.findById(associationOrUserId)
                .or(() -> associationRepository.findByUserId(associationOrUserId))
                .orElseGet(() -> associationRepository.save(Association.builder()
                        .userId(associationOrUserId)
                        .name(associationName != null && !associationName.isBlank()
                                ? associationName
                                : "Association #" + associationOrUserId)
                        .city("Ville non définie")
                        .build()));
    }

    private List<ActionSummaryDTO> enrichSummariesWithPointsCredited(List<Action> actions) {
        if (actions.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> actionIds = actions.stream().map(Action::getId).toList();
        Map<Long, Integer> credited = presenceClient.pointsByAction(actionIds);
        return actions.stream()
                .map(this::toSummaryDTO)
                .peek(dto -> dto.setPointsCredited(credited.getOrDefault(dto.getId(), 0)))
                .collect(Collectors.toList());
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
                .associationName(action.getAssociation() != null
                        ? action.getAssociation().getName()
                        : null)
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
                .associationUserId(action.getAssociation() != null ? action.getAssociation().getUserId() : null)
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
    public Categorie ensureCategoryExists(String categorieName, String description, String imageUrl) {
        return ensureCategoryExists(categorieName, description, imageUrl, true);
    }

    @Transactional
    public Categorie ensureCategoryExists(
            String categorieName,
            String description,
            String imageUrl,
            Boolean published
    ) {
        String name = categorieName == null ? "" : categorieName.trim();
        if (name.isEmpty()) {
            throw new RuntimeException("La catégorie est obligatoire");
        }
        boolean isPublished = published == null || published;
        return categorieRepository.findByNameIgnoreCase(name)
                .map(existing -> {
                    applyCategoryFields(existing, description, imageUrl, isPublished);
                    return categorieRepository.save(existing);
                })
                .orElseGet(() -> {
                    Categorie created = categorieRepository.save(Categorie.builder()
                            .name(name)
                            .description(description != null && !description.isBlank()
                                    ? description
                                    : "Catégorie synchronisée depuis l'administration")
                            .imageUrl(imageUrl)
                            .published(isPublished)
                            .build());
                    log.info("Catégorie créée dans db_action: {}", name);
                    return created;
                });
    }

    @Transactional
    public Categorie syncCategoryFromAdmin(CategorySyncRequest request) {
        String newName = trimCategoryName(request.getNom());
        if (newName == null) {
            throw new RuntimeException("Le nom de catégorie est obligatoire");
        }
        String previousName = trimCategoryName(request.getPreviousNom());
        String lookupName = previousName != null ? previousName : newName;
        boolean published = request.getPublished() == null || request.getPublished();

        Optional<Categorie> existing = categorieRepository.findByNameIgnoreCase(lookupName);
        if (existing.isEmpty() && previousName != null && !previousName.equalsIgnoreCase(newName)) {
            existing = categorieRepository.findByNameIgnoreCase(newName);
        }

        if (existing.isPresent()) {
            Categorie categorie = existing.get();
            categorie.setName(newName);
            applyCategoryFields(categorie, request.getDescription(), request.getImageUrl(), published);
            Categorie saved = categorieRepository.save(categorie);
            long linkedActions = actionRepository.countByCategoryId(saved.getId());
            log.info("Catégorie synchronisée '{}' → '{}' ({} action(s) liée(s))",
                    lookupName, newName, linkedActions);
            return saved;
        }

        return ensureCategoryExists(newName, request.getDescription(), request.getImageUrl(), published);
    }

    @Transactional(readOnly = true)
    public long countActionsUsingCategoryByName(String name) {
        String trimmed = trimCategoryName(name);
        if (trimmed == null) {
            return 0;
        }
        return categorieRepository.findByNameIgnoreCase(trimmed)
                .map(c -> actionRepository.countByCategoryId(c.getId()))
                .orElse(0L);
    }

    @Transactional(readOnly = true)
    public List<CategoryAdminDetailDTO> listAllCategoriesForAdmin() {
        return categorieRepository.findAllByOrderByNameAsc().stream()
                .map(c -> CategoryAdminDetailDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .imageUrl(c.getImageUrl())
                        .published(c.getPublished())
                        .actionCount(actionRepository.countByCategoryId(c.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryLinkedActionDTO> listActionsLinkedToCategoryByName(String name) {
        String trimmed = trimCategoryName(name);
        if (trimmed == null) {
            return List.of();
        }
        Categorie categorie = categorieRepository.findByNameIgnoreCase(trimmed)
                .orElse(null);
        if (categorie == null) {
            return List.of();
        }
        return actionRepository.findByCategoryId(categorie.getId()).stream()
                .map(this::toCategoryLinkedActionDTO)
                .collect(Collectors.toList());
    }

    private CategoryLinkedActionDTO toCategoryLinkedActionDTO(Action action) {
        return CategoryLinkedActionDTO.builder()
                .id(action.getId())
                .title(action.getTitle())
                .status(action.getStatus() != null ? action.getStatus().name() : null)
                .city(action.getCity())
                .associationName(
                        action.getAssociation() != null ? action.getAssociation().getName() : null
                )
                .isFixed(action.getIsFixed())
                .build();
    }

    private static String trimCategoryName(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Transactional
    public void deleteCategory(Long id) {
        deleteCategory(id, false);
    }

    @Transactional
    public void deleteCategory(Long id, boolean cascade) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable: " + id));
        deleteCategoryEntity(categorie, cascade);
    }

    @Transactional
    public void deleteCategoryByName(String name) {
        deleteCategoryByName(name, false);
    }

    @Transactional
    public void deleteCategoryByName(String name, boolean cascade) {
        String trimmed = name == null ? "" : name.trim();
        Categorie categorie = categorieRepository.findByNameIgnoreCase(trimmed)
                .orElse(null);
        if (categorie == null) {
            log.info("Catégorie '{}' absente de db_action — rien à supprimer", trimmed);
            return;
        }
        deleteCategoryEntity(categorie, cascade);
    }

    private void deleteCategoryEntity(Categorie categorie, boolean cascade) {
        long linked = actionRepository.countByCategoryId(categorie.getId());
        if (linked > 0 && !cascade) {
            throw new RuntimeException(
                    "Impossible de supprimer « " + categorie.getName() + " » : "
                            + linked + " action(s) utilisent cette catégorie."
            );
        }
        if (cascade && linked > 0) {
            deleteActionsForCategory(categorie.getId());
        }
        categorieRepository.delete(categorie);
        log.info("Catégorie supprimée dans db_action: {} ({} action(s) supprimée(s))",
                categorie.getName(), cascade ? linked : 0);
    }

    private void deleteActionsForCategory(Long categoryId) {
        List<Action> actions = actionRepository.findByCategoryId(categoryId);
        for (Action action : actions) {
            actionPhotoRepository.deleteByActionId(action.getId());
        }
        actionRepository.deleteAll(actions);
        log.info("{} action(s) supprimée(s) pour la catégorie id={}", actions.size(), categoryId);
    }

    @Transactional
    public void updateCategorie(String name, Map<String, Object> event) {
        String newName = name;
        if (event.get("nom") != null) {
            newName = event.get("nom").toString();
        }
        String previousName = event.get("previousNom") != null
                ? event.get("previousNom").toString()
                : newName;

        CategorySyncRequest request = new CategorySyncRequest();
        request.setPreviousNom(previousName);
        request.setNom(newName);
        if (event.containsKey("description")) {
            request.setDescription(event.get("description").toString());
        }
        if (event.containsKey("imageUrl")) {
            request.setImageUrl(event.get("imageUrl").toString());
        }
        if (event.containsKey("published") && event.get("published") != null) {
            request.setPublished(Boolean.parseBoolean(event.get("published").toString()));
        }
        syncCategoryFromAdmin(request);
    }

    private void applyCategoryFields(
            Categorie categorie,
            String description,
            String imageUrl,
            boolean published
    ) {
        if (description != null && !description.isBlank()) {
            categorie.setDescription(description);
        }
        if (imageUrl != null && !imageUrl.isBlank()) {
            categorie.setImageUrl(imageUrl);
        }
        categorie.setPublished(published);
    }

    // ─── UPLOAD PHOTO ─────────────────────────────────────────

    @Transactional
    public String uploadPhoto(Long actionId, MultipartFile photo, Long userId) {
        Action action = getActionOwnedByUser(actionId, userId);
        return storeActionPhoto(action, photo);
    }

    private String storeActionPhoto(Action action, MultipartFile photo) {
        Long actionId = action.getId();
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