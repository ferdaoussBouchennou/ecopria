package com.example.admin_service.config;

import com.example.admin_service.model.Configuration;
import com.example.admin_service.repository.ConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AdminConfigDataInitializer implements ApplicationRunner {

    private final ConfigurationRepository configurationRepository;

    @Override
    public void run(ApplicationArguments args) {
        configurationRepository.findByCle("taux_commission").orElseGet(() ->
                configurationRepository.save(Configuration.builder()
                        .cle("taux_commission")
                        .valeur("15")
                        .description("Taux de commission global (%)")
                        .updatedAt(LocalDateTime.now())
                        .build())
        );
    }
}
