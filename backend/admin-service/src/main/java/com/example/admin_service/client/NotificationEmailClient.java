package com.example.admin_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEmailClient {

    private final RestTemplate restTemplate;

    @Value("${services.notification-url:http://localhost:8086}")
    private String notificationServiceUrl;

    public void sendAccountDeactivatedEmail(String email, String raison) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("raison", raison);
        postInternal("/internal/account-deactivated-email", body, "désactivation", email);
    }

    public void sendAccountReactivatedEmail(String email) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        postInternal("/internal/account-reactivated-email", body, "réactivation", email);
    }

    private void postInternal(String path, Map<String, Object> body, String kind, String email) {
        String url = notificationServiceUrl.replaceAll("/+$", "") + path;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
            log.info("E-mail de {} envoyé via notification-service → {}", kind, email);
        } catch (ResourceAccessException ex) {
            throw new IllegalStateException(
                    "service-notification injoignable sur " + url
                            + " — lancez-le en local : cd backend/service-notification && mvn spring-boot:run",
                    ex);
        } catch (RestClientException ex) {
            throw new IllegalStateException(
                    "service-notification a refusé l'e-mail (" + url + ") : " + ex.getMessage(),
                    ex);
        }
    }
}
