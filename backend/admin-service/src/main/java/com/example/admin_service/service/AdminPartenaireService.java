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
public class AdminPartenaireService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;

    @Value("${services.recompense-url}")
    private String recompenseServiceUrl;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    public List<?> getAll() {
        return restTemplate.getForObject(
                recompenseServiceUrl + "/internal/partenaires",
                List.class
        );
    }

    public List<?> getPending() {
        return restTemplate.getForObject(
                recompenseServiceUrl + "/internal/partenaires?status=PENDING",
                List.class
        );
    }

    public void approve(Long partenaireId, Long adminId) {
        Map partenaire = restTemplate.getForObject(
                recompenseServiceUrl + "/internal/partenaires/" + partenaireId,
                Map.class
        );
        Long userId = Long.valueOf(partenaire.get("userId").toString());
        String email = getEmail(userId);

        restTemplate.put(
                recompenseServiceUrl + "/internal/partenaires/"
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

        saveLog(adminId, "VALIDER_PARTENAIRE", partenaireId, "PARTENAIRE");
    }

    public void reject(Long partenaireId, StatutChangeRequest request, Long adminId) {
        Map partenaire = restTemplate.getForObject(
                recompenseServiceUrl + "/internal/partenaires/" + partenaireId,
                Map.class
        );
        Long userId = Long.valueOf(partenaire.get("userId").toString());
        String email = getEmail(userId);

        restTemplate.put(
                recompenseServiceUrl + "/internal/partenaires/"
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
                recompenseServiceUrl + "/internal/partenaires/" + partenaireId,
                Map.class
        );
        Long userId = Long.valueOf(partenaire.get("userId").toString());
        String email = getEmail(userId);

        restTemplate.put(
                recompenseServiceUrl + "/internal/partenaires/"
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
