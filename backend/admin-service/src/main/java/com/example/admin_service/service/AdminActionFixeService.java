package com.example.admin_service.service;


import com.example.admin_service.dto.request.ActionFixeRequest;
import com.example.admin_service.dto.response.ActionFixeResponse;
import com.example.admin_service.kafka.event.ActionFixeEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.ActionFixe;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.ActionFixeRepository;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminActionFixeService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final ActionFixeRepository actionFixeRepository;
    private final CategorySyncService categorySyncService;

    public List<ActionFixeResponse> getAll() {
        return actionFixeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void create(ActionFixeRequest request, Long adminId) {
        String categorie = categorySyncService.ensureCategoryExists(request.getCategorie(), adminId);
        LocalDateTime now = LocalDateTime.now();
        ActionFixe actionFixe = actionFixeRepository.save(ActionFixe.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .categorie(categorie)
                .estFixe(true)
                .points(request.getPoints())
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build());

        kafkaProducer.publishActionFixeCreee(toEvent(actionFixe));
        saveLog(adminId, "CREER_ACTION_FIXE", actionFixe.getId(), "ACTION_FIXE");
    }

    public void update(Long id, ActionFixeRequest request, Long adminId) {
        String categorie = categorySyncService.ensureCategoryExists(request.getCategorie(), adminId);
        ActionFixe actionFixe = actionFixeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Action fixe not found: " + id));
        actionFixe.setTitre(request.getTitre());
        actionFixe.setDescription(request.getDescription());
        actionFixe.setCategorie(categorie);
        actionFixe.setEstFixe(true);
        actionFixe.setPoints(request.getPoints());
        actionFixe.setUpdatedAt(LocalDateTime.now());
        actionFixe = actionFixeRepository.save(actionFixe);

        kafkaProducer.publishActionFixeModifiee(toEvent(actionFixe));

        saveLog(adminId, "MODIFIER_ACTION_FIXE", id, "ACTION_FIXE");
    }

    public void deactivate(Long id, Long adminId) {
        ActionFixe actionFixe = actionFixeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Action fixe not found: " + id));
        actionFixe.setActive(false);
        actionFixe.setUpdatedAt(LocalDateTime.now());
        actionFixeRepository.save(actionFixe);

        kafkaProducer.publishActionFixeDesactivee(ActionFixeEvent.builder()
                .actionFixeId(id)
                .build());

        saveLog(adminId, "DESACTIVER_ACTION_FIXE", id, "ACTION_FIXE");
    }

    public void activate(Long id, Long adminId) {
        ActionFixe actionFixe = actionFixeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Action fixe not found: " + id));
        actionFixe.setActive(true);
        actionFixe.setUpdatedAt(LocalDateTime.now());
        actionFixeRepository.save(actionFixe);

        kafkaProducer.publishActionFixeActivee(ActionFixeEvent.builder()
                .actionFixeId(id)
                .build());

        saveLog(adminId, "ACTIVER_ACTION_FIXE", id, "ACTION_FIXE");
    }

    private ActionFixeEvent toEvent(ActionFixe actionFixe) {
        return ActionFixeEvent.builder()
                .actionFixeId(actionFixe.getId())
                .titre(actionFixe.getTitre())
                .description(actionFixe.getDescription())
                .categorie(actionFixe.getCategorie())
                .points(actionFixe.getPoints())
                .build();
    }

    private ActionFixeResponse toResponse(ActionFixe actionFixe) {
        return ActionFixeResponse.builder()
                .id(actionFixe.getId())
                .titre(actionFixe.getTitre())
                .description(actionFixe.getDescription())
                .categorie(actionFixe.getCategorie())
                .estFixe(actionFixe.getEstFixe())
                .associationId(actionFixe.getAssociationId())
                .associationName(actionFixe.getAssociationName())
                .points(actionFixe.getPoints())
                .active(actionFixe.getActive())
                .updatedAt(actionFixe.getUpdatedAt())
                .build();
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
