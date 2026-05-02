package com.example.admin_service.service;


import com.example.admin_service.dto.request.ActionFixeRequest;
import com.example.admin_service.kafka.event.ActionFixeEvent;
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
public class AdminActionFixeService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    // Get all fixed actions from service-action
    public List<?> getAll() {
        return restTemplate.getForObject(
                actionServiceUrl + "/internal/actions-fixes",
                List.class
        );
    }

    // Create → publish Kafka, service-action saves it
    public void create(ActionFixeRequest request, Long adminId) {
        kafkaProducer.publishActionFixeCreee(ActionFixeEvent.builder()
                .titre(request.getTitre())
                .categorie(request.getCategorie())
                .lieu(request.getLieu())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .points(request.getPoints())
                .placesTotal(request.getPlacesTotal())
                .frequence(request.getFrequence())
                .isActive(true)
                .build());

        saveLog(adminId, "CREER_ACTION_FIXE", 0L, "ACTION_FIXE");
    }

    // Update → publish Kafka, service-action updates it
    public void update(Long id, ActionFixeRequest request, Long adminId) {
        kafkaProducer.publishActionFixeModifiee(ActionFixeEvent.builder()
                .actionFixeId(id)
                .titre(request.getTitre())
                .categorie(request.getCategorie())
                .lieu(request.getLieu())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .points(request.getPoints())
                .placesTotal(request.getPlacesTotal())
                .frequence(request.getFrequence())
                .isActive(true)
                .build());

        saveLog(adminId, "MODIFIER_ACTION_FIXE", id, "ACTION_FIXE");
    }

    // Deactivate → publish Kafka, service-action sets isActive=false
    public void deactivate(Long id, Long adminId) {
        kafkaProducer.publishActionFixeDesactivee(ActionFixeEvent.builder()
                .actionFixeId(id)
                .isActive(false)
                .build());

        saveLog(adminId, "DESACTIVER_ACTION_FIXE", id, "ACTION_FIXE");
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
