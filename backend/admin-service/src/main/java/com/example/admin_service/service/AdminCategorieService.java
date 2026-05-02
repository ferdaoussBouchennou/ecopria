package com.example.admin_service.service;


import com.example.admin_service.dto.request.CategorieRequest;
import com.example.admin_service.kafka.event.CategorieEvent;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCategorieService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    public List<?> getAll() {
        return restTemplate.getForObject(
                actionServiceUrl + "/internal/categories",
                List.class
        );
    }

    public void create(CategorieRequest request, Long adminId) {
        kafkaProducer.publishCategorieEvent(CategorieEvent.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .action("CREEE")
                .build());

        saveLog(adminId, "CREER_CATEGORIE", 0L, "CATEGORIE");
    }

    public void update(Long id, CategorieRequest request, Long adminId) {
        kafkaProducer.publishCategorieEvent(CategorieEvent.builder()
                .categorieId(id)
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .action("MODIFIEE")
                .build());

        saveLog(adminId, "MODIFIER_CATEGORIE", id, "CATEGORIE");
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
