package com.example.admin_service.service;

import com.example.admin_service.dto.request.ActionAssociationRequest;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.ActionFixe;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.ActionFixeRepository;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminActionService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final ActionFixeRepository actionFixeRepository;

    public List<?> getAll() {
        // Non-fixed actions created for associations are stored with estFixe=false
        return actionFixeRepository.findAll()
                .stream()
                .filter(a -> Boolean.FALSE.equals(a.getEstFixe()))
                .toList();
    }

    public Object create(ActionAssociationRequest request, Long adminId) {
        LocalDateTime now = LocalDateTime.now();
        ActionFixe action = actionFixeRepository.save(ActionFixe.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .categorie(request.getCategorie())
                .estFixe(false)
                .associationId(request.getAssociationId())
                .associationName(request.getAssociationName())
                .lieu(request.getLieu())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .points(request.getPoints())
                .placesTotal(request.getPlacesTotal())
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build());

        Map<String, Object> event = new HashMap<>();
        event.put("actionId", action.getId());
        event.put("titre", action.getTitre());
        event.put("description", action.getDescription());
        event.put("categorie", action.getCategorie());
        event.put("associationId", action.getAssociationId());
        event.put("associationName", action.getAssociationName());
        event.put("lieu", action.getLieu());
        event.put("latitude", action.getLatitude());
        event.put("longitude", action.getLongitude());
        event.put("points", action.getPoints());
        event.put("placesTotal", action.getPlacesTotal());
        event.put("adminId", adminId);
        kafkaProducer.publishActionAdminEvent("action.creee.admin", String.valueOf(action.getId()), event);

        saveLog(adminId, "CREER_ACTION", 0L, "ACTION");
        return action;
    }

    public void update(Long actionId, ActionAssociationRequest request, Long adminId) {
        ActionFixe action = actionFixeRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action not found: " + actionId));
        action.setTitre(request.getTitre());
        action.setDescription(request.getDescription());
        action.setCategorie(request.getCategorie());
        action.setEstFixe(false);
        action.setAssociationId(request.getAssociationId());
        action.setAssociationName(request.getAssociationName());
        action.setLieu(request.getLieu());
        action.setLatitude(request.getLatitude());
        action.setLongitude(request.getLongitude());
        action.setPoints(request.getPoints());
        action.setPlacesTotal(request.getPlacesTotal());
        action.setUpdatedAt(LocalDateTime.now());
        actionFixeRepository.save(action);

        Map<String, Object> event = new HashMap<>();
        event.put("actionId", action.getId());
        event.put("titre", action.getTitre());
        event.put("description", action.getDescription());
        event.put("categorie", action.getCategorie());
        event.put("associationId", action.getAssociationId());
        event.put("associationName", action.getAssociationName());
        event.put("lieu", action.getLieu());
        event.put("latitude", action.getLatitude());
        event.put("longitude", action.getLongitude());
        event.put("points", action.getPoints());
        event.put("placesTotal", action.getPlacesTotal());
        event.put("adminId", adminId);
        kafkaProducer.publishActionAdminEvent("action.modifiee.admin", String.valueOf(actionId), event);

        saveLog(adminId, "MODIFIER_ACTION", actionId, "ACTION");
    }

    public void activate(Long actionId, Long adminId) {
        ActionFixe action = actionFixeRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action not found: " + actionId));
        action.setActive(true);
        action.setUpdatedAt(LocalDateTime.now());
        actionFixeRepository.save(action);

        Map<String, Object> event = Map.of(
                "actionId", actionId,
                "adminId", adminId,
                "status", "ACTIVE",
                "eventType", "ACTION_ACTIVEE"
        );
        kafkaProducer.publishActionAdminEvent("action.statut.change", String.valueOf(actionId), event);

        saveLog(adminId, "ACTIVER_ACTION", actionId, "ACTION");
    }

    public void deactivate(Long actionId, String raison, Long adminId) {
        ActionFixe action = actionFixeRepository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Action not found: " + actionId));
        action.setActive(false);
        action.setUpdatedAt(LocalDateTime.now());
        actionFixeRepository.save(action);

        Map<String, Object> event = new HashMap<>();
        event.put("actionId", actionId);
        event.put("adminId", adminId);
        event.put("status", "INACTIVE");
        event.put("raison", raison);
        event.put("eventType", "ACTION_DESACTIVEE");
        kafkaProducer.publishActionAdminEvent("action.statut.change", String.valueOf(actionId), event);

        saveLog(adminId, "DESACTIVER_ACTION", actionId, "ACTION");
    }

    private void saveLog(Long adminId, String action, Long cibleId, String cibleType) {
        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action(action)
                .cibleId(cibleId)
                .cibleType(cibleType)
                .createdAt(LocalDateTime.now())
                .build());
    }
}
