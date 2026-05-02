package com.example.admin_service.service;

import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.LogAdmin;
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

    public List<?> getAll() {
        return List.of();
    }

    public Object create(Map<String, Object> request, Long adminId) {
        Map<String, Object> event = new HashMap<>(request);
        event.put("adminId", adminId);
        event.put("eventType", "ACTION_CREEE");
        kafkaProducer.publishActionAdminEvent("action.creee.admin", String.valueOf(adminId), event);

        saveLog(adminId, "CREER_ACTION", 0L, "ACTION");
        return event;
    }

    public void update(Long actionId, Map<String, Object> request, Long adminId) {
        Map<String, Object> event = new HashMap<>(request);
        event.put("actionId", actionId);
        event.put("adminId", adminId);
        event.put("eventType", "ACTION_MODIFIEE");
        kafkaProducer.publishActionAdminEvent("action.modifiee.admin", String.valueOf(actionId), event);

        saveLog(adminId, "MODIFIER_ACTION", actionId, "ACTION");
    }

    public void activate(Long actionId, Long adminId) {
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
