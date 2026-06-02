package com.example.auth_service.client;

import com.example.auth_service.dto.EmailVerificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEmailClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service-url:http://localhost:8086}")
    private String notificationServiceUrl;

    public boolean sendVerificationEmail(EmailVerificationEvent event) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", event.getEmail());
        body.put("code", event.getCode());
        body.put("firstName", event.getFirstName());
        body.put("first_name", event.getFirstName());
        body.put("userId", event.getUserId());
        return postInternal("/internal/verification-email", body, "vérification", event.getEmail());
    }

    public boolean sendPasswordResetEmail(String email, String code) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("code", code);
        return postInternal("/internal/password-reset-email", body, "réinitialisation", email);
    }

    private boolean postInternal(String path, Map<String, Object> body, String kind, String email) {
        String url = notificationServiceUrl.replaceAll("/+$", "") + path;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
            log.info("E-mail de {} envoyé via notification-service → {}", kind, email);
            return true;
        } catch (Exception ex) {
            log.warn("Échec envoi HTTP {} vers notification-service ({}): {}", kind, email, ex.getMessage());
            return false;
        }
    }
}
