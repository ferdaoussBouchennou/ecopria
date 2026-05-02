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

    @Value("${services.action-url}")
    private String actionServiceUrl;

    public List<?> getAll() {
        return restTemplate.getForObject(
                actionServiceUrl + "/internal/associations",
                List.class
        );
    }

    public List<?> getPending() {
        return restTemplate.getForObject(
                actionServiceUrl + "/internal/associations?status=PENDING",
                List.class
        );
    }

    public void approve(Long associationId, Long adminId) {
        // Get userId from service-action
        Map assoc = restTemplate.getForObject(
                actionServiceUrl + "/internal/associations/" + associationId,
                Map.class
        );
        Long userId = Long.valueOf(assoc.get("userId").toString());
        String email = getEmail(userId);

        // Update isActive in service-action
        restTemplate.put(
                actionServiceUrl + "/internal/associations/"
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

        saveLog(adminId, "VALIDER_ASSOCIATION", associationId, "ASSOCIATION");
    }

    public void reject(Long associationId,
                       StatutChangeRequest request,
                       Long adminId) {
        Map assoc = restTemplate.getForObject(
                actionServiceUrl + "/internal/associations/" + associationId,
                Map.class
        );
        Long userId = Long.valueOf(assoc.get("userId").toString());
        String email = getEmail(userId);

        restTemplate.put(
                actionServiceUrl + "/internal/associations/"
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
                actionServiceUrl + "/internal/associations/" + associationId,
                Map.class
        );
        Long userId = Long.valueOf(assoc.get("userId").toString());
        String email = getEmail(userId);

        restTemplate.put(
                actionServiceUrl + "/internal/associations/"
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
