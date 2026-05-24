package com.ecopria.notification.client;

import com.ecopria.notification.client.dto.CitizenContactSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class UtilisateurContactClient {

    private final RestTemplate restTemplate;

    @Value("${ecopria.internal.utilisateur-base-url:http://service-utilisateur-backend:8082}")
    private String utilisateurBaseUrl;

    public Optional<String> getEmail(Long authId) {
        try {
            String url = utilisateurBaseUrl + "/api/utilisateurs/internal/contact/" + authId + "/email";
            ResponseEntity<Map<String, String>> res = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<Map<String, String>>() {});
            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                return Optional.empty();
            }
            String email = res.getBody().get("email");
            if (email == null || email.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(email.trim());
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Contact utilisateur indisponible pour authId={} : {}", authId, e.getMessage());
            return Optional.empty();
        }
    }

    public List<CitizenContactSnapshot> findCitizensByCity(String city) {
        if (city == null || city.isBlank()) {
            return Collections.emptyList();
        }
        try {
            String url = utilisateurBaseUrl + "/api/utilisateurs/internal/citizens/contacts?city="
                    + java.net.URLEncoder.encode(city.trim(), java.nio.charset.StandardCharsets.UTF_8);
            ResponseEntity<List<CitizenContactSnapshot>> res = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<CitizenContactSnapshot>>() {});
            if (res.getBody() == null) {
                return Collections.emptyList();
            }
            return res.getBody();
        } catch (Exception e) {
            log.warn("Liste citoyens ville={} indisponible : {}", city, e.getMessage());
            return Collections.emptyList();
        }
    }
}
