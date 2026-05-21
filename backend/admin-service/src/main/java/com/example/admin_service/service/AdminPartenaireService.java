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
public class AdminPartenaireService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;

    @Value("${services.utilisateur-url}")
    private String utilisateurServiceUrl;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    public List<?> getAll() {
        return restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/partenaires",
                List.class
        );
    }

    public List<?> getPending() {
        return restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/partenaires?status=PENDING",
                List.class
        );
    }

    public void approve(Long partenaireId, Long adminId) {
        Map partenaire = restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/partenaires/" + partenaireId,
                Map.class
        );
        Long userId = extractUserId(partenaire);
        String email = getEmail(userId);

        restTemplate.put(
                utilisateurServiceUrl + "/internal/partenaires/"
                        + partenaireId + "/activate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("VALIDEE")
                .raison(null)
                .type("PARTENAIRE")
                .build());

        Map<String, Object> partenaireValideeEvent = new HashMap<>();
        partenaireValideeEvent.put("userId", userId);
        partenaireValideeEvent.put("nom", extractString(partenaire, "nom", "name"));
        partenaireValideeEvent.put("categorie", extractString(partenaire, "categorie", "category"));
        kafkaProducer.publishPartenaireValidee(partenaireValideeEvent, String.valueOf(userId));

        saveLog(adminId, "VALIDER_PARTENAIRE", partenaireId, "PARTENAIRE");
    }

    public void reject(Long partenaireId, StatutChangeRequest request, Long adminId) {
        Map partenaire = restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/partenaires/" + partenaireId,
                Map.class
        );
        Long userId = extractUserId(partenaire);
        String email = getEmail(userId);

        restTemplate.put(
                utilisateurServiceUrl + "/internal/partenaires/"
                        + partenaireId + "/deactivate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("REJETEE")
                .raison(request.getRaison())
                .type("PARTENAIRE")
                .build());

        saveLog(adminId, "REJETER_PARTENAIRE", partenaireId, "PARTENAIRE");
    }

    public void deactivate(Long partenaireId, StatutChangeRequest request, Long adminId) {
        Map partenaire = restTemplate.getForObject(
                utilisateurServiceUrl + "/internal/partenaires/" + partenaireId,
                Map.class
        );
        Long userId = extractUserId(partenaire);
        String email = getEmail(userId);

        restTemplate.put(
                utilisateurServiceUrl + "/internal/partenaires/"
                        + partenaireId + "/deactivate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("DESACTIVEE")
                .raison(request.getRaison())
                .type("PARTENAIRE")
                .build());

        saveLog(adminId, "DESACTIVER_PARTENAIRE", partenaireId, "PARTENAIRE");
    }

    private String getEmail(Long userId) {
        Map response = restTemplate.getForObject(
                authServiceUrl + "/internal/users/" + userId,
                Map.class
        );
        return (String) response.get("email");
    }

    private Long extractUserId(Map partenairePayload) {
        if (partenairePayload == null) {
            throw new RuntimeException("Partenaire not found");
        }
        Object rawUserId = partenairePayload.get("userId");
        if (rawUserId == null) {
            rawUserId = partenairePayload.get("utilisateurId");
        }
        if (rawUserId == null) {
            throw new RuntimeException("Partenaire payload missing userId");
        }
        return Long.valueOf(rawUserId.toString());
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
