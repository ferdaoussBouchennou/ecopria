package com.example.admin_service.service;


import com.example.admin_service.dto.request.CategorieRequest;
import com.example.admin_service.dto.response.CategorieResponse;
import com.example.admin_service.kafka.event.CategorieEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.Categorie;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.CategorieRepository;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCategorieService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final CategorieRepository categorieRepository;

    public List<CategorieResponse> getAll() {
        return categorieRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void create(CategorieRequest request, Long adminId) {
        LocalDateTime now = LocalDateTime.now();
        Categorie categorie = categorieRepository.save(Categorie.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .createdAt(now)
                .updatedAt(now)
                .build());

        kafkaProducer.publishCategorieCreee(CategorieEvent.builder()
                .nom(categorie.getNom())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build());

        saveLog(adminId, "CREER_CATEGORIE", categorie.getId(), "CATEGORIE");
    }

    public void update(Long id, CategorieRequest request, Long adminId) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categorie not found: " + id));
        categorie.setNom(request.getNom());
        categorie.setDescription(request.getDescription());
        categorie.setImageUrl(request.getImageUrl());
        categorie.setUpdatedAt(LocalDateTime.now());
        categorie = categorieRepository.save(categorie);

        kafkaProducer.publishCategorieModifiee(CategorieEvent.builder()
                .nom(categorie.getNom())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build());

        saveLog(adminId, "MODIFIER_CATEGORIE", id, "CATEGORIE");
    }

    private CategorieResponse toResponse(Categorie categorie) {
        return CategorieResponse.builder()
                .id(categorie.getId())
                .nom(categorie.getNom())
                .description(categorie.getDescription())
                .imageUrl(categorie.getImageUrl())
                .updatedAt(categorie.getUpdatedAt())
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
