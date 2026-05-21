package com.example.admin_service.service;


import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.kafka.event.StatutChangeEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAssociationService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    @Value("${services.utilisateur-url}")
    private String utilisateurServiceUrl;

    public List<?> getAll() {
        return restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/associations",
                List.class
        );
    }

    public List<?> getPending() {
        return restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/associations?status=PENDING",
                List.class
        );
    }

    public void approve(Long associationId, Long adminId) {
        Map assoc = restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/associations/" + associationId,
                Map.class
        );
        Long userId = extractUserId(assoc);
        String email = getEmail(userId);

        restTemplate.put(
                utilisateurServiceUrl + "/internal/associations/"
                        + associationId + "/activate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("VALIDEE")
                .raison(null)
                .type("ASSOCIATION")
                .build());
        kafkaProducer.publishAssoValidee(buildAssoValideePayload(assoc, userId), String.valueOf(userId));

        saveLog(adminId, "VALIDER_ASSOCIATION", associationId, "ASSOCIATION");
    }

    public void reject(Long associationId,
                       StatutChangeRequest request,
                       Long adminId) {
        Map assoc = restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/associations/" + associationId,
                Map.class
        );
        Long userId = extractUserId(assoc);
        String email = getEmail(userId);

        restTemplate.put(
                utilisateurServiceUrl + "/internal/associations/"
                        + associationId + "/deactivate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("REJETEE")
                .raison(request.getRaison())
                .type("ASSOCIATION")
                .build());

        saveLog(adminId, "REJETER_ASSOCIATION", associationId, "ASSOCIATION");
    }

    public void deactivate(Long associationId,
                           StatutChangeRequest request,
                           Long adminId) {
        Map assoc = restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/associations/" + associationId,
                Map.class
        );
        Long userId = extractUserId(assoc);
        String email = getEmail(userId);

        restTemplate.put(
                utilisateurServiceUrl + "/internal/associations/"
                        + associationId + "/deactivate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("DESACTIVEE")
                .raison(request.getRaison())
                .type("ASSOCIATION")
                .build());

        saveLog(adminId, "DESACTIVER_ASSOCIATION", associationId, "ASSOCIATION");
    }

    private String getEmail(Long userId) {
        Map response = restTemplate.getForObject(
                authServiceUrl + "/internal/users/" + userId,
                Map.class
        );
        return (String) response.get("email");
    }

    private Long extractUserId(Map associationPayload) {
        if (associationPayload == null) {
            throw new RuntimeException("Association not found");
        }
        Object rawUserId = associationPayload.get("userId");
        if (rawUserId == null) {
            rawUserId = associationPayload.get("utilisateurId");
        }
        if (rawUserId == null) {
            throw new RuntimeException("Association payload missing userId");
        }
        return Long.valueOf(rawUserId.toString());
    }

    private Map<String, Object> buildAssoValideePayload(Map associationPayload, Long userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("nom", extractString(associationPayload, "nom", "name"));
        payload.put("description", extractString(associationPayload, "description", "description"));
        payload.put("lieu", extractString(associationPayload, "lieu", "ville"));
        payload.put("logoUrl", extractString(associationPayload, "logoUrl", "logo"));
        return payload;
    }

    private String extractString(Map payload, String primaryKey, String fallbackKey) {
        Object value = payload.get(primaryKey);
        if (value == null) {
            value = payload.get(fallbackKey);
        }
        return value == null ? "" : value.toString();
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
