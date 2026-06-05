package com.example.admin_service.service;

import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.kafka.event.StatutChangeEvent;
import com.example.admin_service.kafka.producer.AdminKafkaProducer;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminPartenaireService {

    private final AdminKafkaProducer kafkaProducer;
    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    public List<?> getAll() {
        return getPending();
    }

    public List<?> getPending() {
        return fetchPendingByRole("PARTNER");
    }

    public void approve(Long userId, Long adminId) {
        Map<String, Object> account = getPendingAccount(userId, "PARTNER");
        String email = asString(account.get("email"));
        String name = asString(account.get("name"));

        restTemplate.put(authServiceUrl + "/internal/users/" + userId + "/activate", null);

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("VALIDEE")
                .raison(null)
                .type("PARTENAIRE")
                .build());

        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("nom", name);
        payload.put("categorie", "");
        kafkaProducer.publishPartenaireValidee(payload, String.valueOf(userId));

        saveLog(adminId, "VALIDER_PARTENAIRE", userId, "PARTENAIRE");
    }

    public void reject(Long userId, StatutChangeRequest request, Long adminId) {
        Map<String, Object> account = getPendingAccount(userId, "PARTNER");
        String email = asString(account.get("email"));

        String raison = request != null ? request.getRaison() : null;
        Map<String, String> body = new HashMap<>();
        body.put("raison", raison != null && !raison.isBlank() ? raison.trim() : "Rejet administratif");
        restTemplate.exchange(
                authServiceUrl + "/internal/users/" + userId + "/reject-organization",
                HttpMethod.PUT,
                new HttpEntity<>(body),
                Void.class
        );

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("REJETEE")
                .raison(body.get("raison"))
                .type("PARTENAIRE")
                .build());

        saveLog(adminId, "REJETER_PARTENAIRE", userId, "PARTENAIRE");
    }

    public void deactivate(Long userId, StatutChangeRequest request, Long adminId) {
        Map<String, Object> user = restTemplate.getForObject(
                authServiceUrl + "/internal/users/" + userId,
                Map.class
        );
        String email = asString(user != null ? user.get("email") : null);

        restTemplate.put(authServiceUrl + "/internal/users/" + userId + "/deactivate", null);

        kafkaProducer.publishStatutChange(StatutChangeEvent.builder()
                .userId(userId)
                .email(email)
                .action("DESACTIVEE")
                .raison(request != null ? request.getRaison() : null)
                .type("PARTENAIRE")
                .build());

        saveLog(adminId, "DESACTIVER_PARTENAIRE", userId, "PARTENAIRE");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchPendingByRole(String role) {
        List<Map<String, Object>> pending = restTemplate.getForObject(
                authServiceUrl + "/internal/users/pending-accounts",
                List.class
        );
        if (pending == null) {
            return List.of();
        }
        return pending.stream()
                .filter(row -> role.equalsIgnoreCase(asString(row.get("role"))))
                .toList();
    }

    private Map<String, Object> getPendingAccount(Long userId, String role) {
        return fetchPendingByRole(role).stream()
                .filter(row -> {
                    Object raw = row.get("userId");
                    return raw != null && Long.valueOf(raw.toString()).equals(userId);
                })
                .findFirst()
                .orElseGet(() -> {
                    Map<String, Object> fallback = new HashMap<>();
                    fallback.put("userId", userId);
                    Map user = restTemplate.getForObject(authServiceUrl + "/internal/users/" + userId, Map.class);
                    if (user != null) {
                        fallback.put("email", user.get("email"));
                    }
                    fallback.put("name", "Partenaire");
                    fallback.put("role", role);
                    return fallback;
                });
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
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
}
