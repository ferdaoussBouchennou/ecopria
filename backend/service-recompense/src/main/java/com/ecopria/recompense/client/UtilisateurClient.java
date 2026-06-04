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

    @Value("${services.utilisateur.url:http://service-utilisateur-backend:8080}")
    private String utilisateurServiceUrl;

    // vérifier le solde de points avant l'échange
    public Integer getPoints(Long userId) {
        try {
            String url = utilisateurServiceUrl + "/api/users/" + userId + "/points";
            log.info("Appel API: GET {}", url);
            Map response = restTemplate.getForObject(url, Map.class);
            return (Integer) response.get("totalPoints");
        } catch (Exception e) {
            log.error("Erreur appel service-utilisateur pour userId: {}", userId, e);
            throw new RuntimeException("Impossible de vérifier le solde de points");
        }
    }

    // déduire des points après l'échange
    public void deduirePoints(Long userId, Integer points, String raison) {
        try {
            String url = utilisateurServiceUrl + "/api/users/" + userId + "/points/deduct";
            log.info("Appel API: POST {} - Déduction de {} points pour userId: {}", url, points, userId);
            
            Map<String, Object> request = Map.of(
                "points", points,
                "raison", raison
            );
            
            restTemplate.postForObject(url, request, Map.class);
            log.info("Points déduits avec succès: {} points pour userId: {}", points, userId);
        } catch (Exception e) {
            log.error("Erreur lors de la déduction de points pour userId: {}", userId, e);
            // On ne lance pas d'exception pour ne pas bloquer l'échange
            // Le coupon est déjà créé, on log juste l'erreur
        }
    }
}