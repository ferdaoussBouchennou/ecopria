package com.ecopria.recompense.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class UtilisateurClient {

    private final RestTemplate restTemplate;

    @Value("${services.utilisateur.url:http://service-utilisateur:8082}")
    private String utilisateurServiceUrl;

    // vérifier le solde de points avant l'échange
    public Integer getPoints(Long userId) {
        try {
            String url = utilisateurServiceUrl + "/api/utilisateurs/" + userId + "/points";
            Map response = restTemplate.getForObject(url, Map.class);
            return (Integer) response.get("totalPoints");
        } catch (Exception e) {
            log.error("Erreur appel service-utilisateur pour userId: {}", userId, e);
            throw new RuntimeException("Impossible de vérifier le solde de points");
        }
    }
}