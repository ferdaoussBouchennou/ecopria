package com.example.admin_service.config;

import com.example.admin_service.kafka.event.CategorieEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.Categorie;
import com.example.admin_service.repository.CategorieRepository;
import com.example.admin_service.service.CategorySyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminCategorySeedInitializer implements ApplicationRunner {

    private final CategorieRepository categorieRepository;
    private final AdminKafkaProducer kafkaProducer;
    private final CategorySyncService categorySyncService;

    @Override
    public void run(ApplicationArguments args) {
        if (categorieRepository.count() > 0) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (AdminCategoryDefaults.SeedCategory seed : AdminCategoryDefaults.SEED) {
            Categorie categorie = categorieRepository.save(Categorie.builder()
                    .nom(seed.getNom())
                    .description(seed.getDescription())
                    .imageUrl(seed.getImageUrl())
                    .published(true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());

            kafkaProducer.publishCategorieCreee(CategorieEvent.builder()
                    .nom(categorie.getNom())
                    .description(categorie.getDescription())
                    .imageUrl(categorie.getImageUrl())
                    .published(true)
                    .build());

            try {
                categorySyncService.syncToActionDb(
                        categorie.getNom(),
                        categorie.getDescription(),
                        categorie.getImageUrl(),
                        true
                );
            } catch (Exception ex) {
                log.warn("Seed catégorie '{}' : sync action reportée ({})", seed.getNom(), ex.getMessage());
            }
        }
        log.info("[admin] {} catégories d'actions initialisées", AdminCategoryDefaults.SEED.size());
    }
}
