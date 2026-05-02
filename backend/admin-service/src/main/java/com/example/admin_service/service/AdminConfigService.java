package com.example.admin_service.service;


import com.example.admin_service.dto.request.ConfigurationRequest;
import com.example.admin_service.dto.response.ConfigurationResponse;
import com.example.admin_service.model.Configuration;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.ConfigurationRepository;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminConfigService {

    private final ConfigurationRepository configRepository;
    private final LogAdminRepository logAdminRepository;

    public List<ConfigurationResponse> getAll() {
        return configRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ConfigurationResponse update(String cle,
                                        ConfigurationRequest request,
                                        Long adminId) {
        Configuration config = configRepository.findByCle(cle)
                .orElseThrow(() -> new RuntimeException("Config not found: " + cle));

        config.setValeur(request.getValeur());
        config.setDescription(request.getDescription());
        config.setUpdatedAt(LocalDateTime.now());
        config = configRepository.save(config);

        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action("MODIFIER_CONFIGURATION")
                .cibleId(config.getId())
                .cibleType("CONFIGURATION")
                .createdAt(LocalDateTime.now())
                .build());

        return toResponse(config);
    }

    private ConfigurationResponse toResponse(Configuration c) {
        return ConfigurationResponse.builder()
                .id(c.getId())
                .cle(c.getCle())
                .valeur(c.getValeur())
                .description(c.getDescription())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}