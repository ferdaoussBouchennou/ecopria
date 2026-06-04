package com.example.admin_service.service;


import com.example.admin_service.client.NotificationEmailClient;
import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.dto.response.AdminUserActionResponse;
import com.example.admin_service.dto.response.AdminUserResponse;
import com.example.admin_service.kafka.event.StatutChangeEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;
    private final NotificationEmailClient notificationEmailClient;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    public List<AdminUserResponse> getAllUsers(String email, String role, Boolean isActive, Boolean isVerified) {
        List<Map<String, Object>> users = restTemplate.exchange(
                authServiceUrl + "/internal/users",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        ).getBody();

        if (users == null) {
            return List.of();
        }

        return users.stream()
                .map(this::toResponse)
                .filter(user -> email == null || email.isBlank()
                        || user.getEmail().toLowerCase().contains(email.toLowerCase().trim()))
                .filter(user -> role == null || role.isBlank()
                        || user.getRole().equalsIgnoreCase(role.trim()))
                .filter(user -> isActive == null || Objects.equals(user.getIsActive(), isActive))
                .filter(user -> isVerified == null || Objects.equals(user.getIsVerified(), isVerified))
                .collect(Collectors.toList());
    }

    public AdminUserActionResponse banUser(Long userId, StatutChangeRequest request, Long adminId) {
        if (request == null || request.getRaison() == null || request.getRaison().isBlank()) {
            throw new IllegalArgumentException("La raison du bannissement est obligatoire.");
        }
        if (Objects.equals(userId, adminId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas bannir votre propre compte.");
        }

        Map<String, Object> user = getUserMap(userId);
        if ("ADMIN".equalsIgnoreCase(asString(user.get("role")))) {
            throw new IllegalArgumentException("Impossible de bannir un compte administrateur.");
        }
        if (!Boolean.TRUE.equals(parseBoolean(user.get("isActive")))) {
            throw new IllegalArgumentException("Ce compte est déjà inactif.");
        }

        String email = asString(user.get("email"));
        restTemplate.put(authServiceUrl + "/internal/users/" + userId + "/deactivate", null);

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("BANNI")
                .raison(request.getRaison())
                .type("USER")
                .build());

        boolean emailSent = sendDeactivationEmail(email, request.getRaison());

        saveLog(adminId, "BANNIR_USER", userId, "USER");

        return AdminUserActionResponse.builder()
                .emailSent(emailSent)
                .message(emailSent
                        ? "Compte banni. Un e-mail a été envoyé à " + email + "."
                        : "Compte banni. L'e-mail n'a pas pu être envoyé — démarrez service-notification (port 8086) "
                                + "et vérifiez EMAIL_USERNAME / EMAIL_PASSWORD dans le fichier .env à la racine du projet.")
                .build();
    }

    public AdminUserActionResponse reactivateUser(Long userId, Long adminId) {
        Map<String, Object> user = getUserMap(userId);
        if (Boolean.TRUE.equals(parseBoolean(user.get("isActive")))) {
            throw new IllegalArgumentException("Ce compte est déjà actif.");
        }

        String email = asString(user.get("email"));
        restTemplate.put(authServiceUrl + "/internal/users/" + userId + "/activate", null);

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("REACTIVE")
                .raison(null)
                .type("USER")
                .build());

        boolean emailSent = sendReactivationEmail(email);

        saveLog(adminId, "REACTIVER_USER", userId, "USER");

        return AdminUserActionResponse.builder()
                .emailSent(emailSent)
                .message(emailSent
                        ? "Compte réactivé. Un e-mail a été envoyé à " + email + "."
                        : "Compte réactivé. L'e-mail n'a pas pu être envoyé — vérifiez service-notification (8086) et le SMTP dans .env.")
                .build();
    }

    private boolean sendDeactivationEmail(String email, String raison) {
        if (email == null || email.isBlank()) {
            log.warn("Pas d'e-mail pour notifier la désactivation");
            return false;
        }
        try {
            notificationEmailClient.sendAccountDeactivatedEmail(email, raison);
            return true;
        } catch (Exception ex) {
            log.error("E-mail de désactivation non envoyé → {} : {}", email, ex.getMessage(), ex);
            return false;
        }
    }

    private boolean sendReactivationEmail(String email) {
        if (email == null || email.isBlank()) {
            log.warn("Pas d'e-mail pour notifier la réactivation");
            return false;
        }
        try {
            notificationEmailClient.sendAccountReactivatedEmail(email);
            return true;
        } catch (Exception ex) {
            log.error("E-mail de réactivation non envoyé → {} : {}", email, ex.getMessage(), ex);
            return false;
        }
    }

    private Map<String, Object> getUserMap(Long userId) {
        Map<String, Object> response = restTemplate.getForObject(
                authServiceUrl + "/internal/users/" + userId,
                Map.class
        );
        if (response == null) {
            throw new RuntimeException("Utilisateur introuvable: " + userId);
        }
        return response;
    }

    private AdminUserResponse toResponse(Map<String, Object> row) {
        return AdminUserResponse.builder()
                .userId(asLong(row.get("userId")))
                .email(asString(row.get("email")))
                .role(asString(row.get("role")))
                .isActive(parseBoolean(row.get("isActive")))
                .isVerified(parseBoolean(row.get("isVerified")))
                .displayName(asString(row.get("displayName")))
                .createdAt(asString(row.get("createdAt")))
                .build();
    }

    private void saveLog(Long adminId, String action, Long cibleId, String cibleType) {
        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action(action)
                .cibleId(cibleId)
                .cibleType(cibleType)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private static Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static Boolean parseBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value == null) {
            return null;
        }
        return Boolean.parseBoolean(value.toString());
    }
}
