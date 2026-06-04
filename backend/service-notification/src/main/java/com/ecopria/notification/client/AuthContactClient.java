package com.ecopria.notification.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class AuthContactClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ecopria.internal.auth-base-url:http://localhost:8081}")
    private String authBaseUrl;

    @SuppressWarnings("unchecked")
    public Optional<String> getEmail(Long authId) {
        if (authId == null) {
            return Optional.empty();
        }
        String base = authBaseUrl.endsWith("/") ? authBaseUrl.substring(0, authBaseUrl.length() - 1) : authBaseUrl;
        String url = base + "/internal/users/" + authId;
        try {
            Map<String, Object> user = restTemplate.getForObject(url, Map.class);
            if (user == null) {
                return Optional.empty();
            }
            Object email = user.get("email");
            if (email == null || email.toString().isBlank()) {
                return Optional.empty();
            }
            return Optional.of(email.toString().trim());
        } catch (Exception e) {
            log.debug("E-mail auth indisponible pour authId={} : {}", authId, e.getMessage());
            return Optional.empty();
        }
    }
}
