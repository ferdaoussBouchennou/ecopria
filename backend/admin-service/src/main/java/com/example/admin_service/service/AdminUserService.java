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
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    public List<?> getAllUsers(String email, String role, Boolean isActive) {
        List<Map<String, Object>> users = restTemplate.getForObject(
                authServiceUrl + "/internal/users",
                List.class
        );
        if (users == null) {
            return List.of();
        }

        return users.stream()
                .filter(user -> email == null
                        || Objects.toString(user.get("email"), "")
                        .toLowerCase()
                        .contains(email.toLowerCase()))
                .filter(user -> role == null
                        || Objects.toString(user.get("role"), "")
                        .equalsIgnoreCase(role))
                .filter(user -> isActive == null
                        || Boolean.valueOf(Objects.toString(user.get("isActive"), "false")).equals(isActive))
                .toList();
    }

    public void banUser(Long userId,
                        StatutChangeRequest request,
                        Long adminId) {
        String email = getEmail(userId);

        // Set isActive = false in db_auth
        restTemplate.put(
                authServiceUrl + "/internal/users/" + userId + "/deactivate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("BANNI")
                .raison(request.getRaison())
                .type("USER")
                .build());

        saveLog(adminId, "BANNIR_USER", userId, "USER");
    }

    public void reactivateUser(Long userId, Long adminId) {
        String email = getEmail(userId);

        restTemplate.put(
                authServiceUrl + "/internal/users/" + userId + "/activate",
                null
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("REACTIVE")
                .raison(null)
                .type("USER")
                .build());

        saveLog(adminId, "REACTIVER_USER", userId, "USER");
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
