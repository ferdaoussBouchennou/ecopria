package com.ecopria.inscription.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Client REST pour vérifier la présence d'un citoyen à une action
 * depuis service-inscription (utilisé par AbsenceJob).
 */
@Service
public class PresenceClient {

    private final RestTemplate restTemplate;
    private final String presenceServiceUrl;

    public PresenceClient(@Value("${service.presence.url}") String presenceServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.presenceServiceUrl = presenceServiceUrl;
    }

    /**
     * Retourne true si la présence du citoyen à l'action est validée, false sinon.
     */
    @SuppressWarnings("unchecked")
    public boolean estPresent(Long userId, Long actionId) {
        String base = presenceServiceUrl.endsWith("/")
                ? presenceServiceUrl.substring(0, presenceServiceUrl.length() - 1)
                : presenceServiceUrl;
        String url = base + "/presences/verif?userId=" + userId + "&actionId=" + actionId;
        try {
            Map<String, Boolean> response = restTemplate.getForObject(url, Map.class);
            return response != null && Boolean.TRUE.equals(response.get("present"));
        } catch (RestClientException e) {
            System.err.println("[AbsenceJob] Impossible de vérifier la présence userId=" + userId
                    + " actionId=" + actionId + " : " + e.getMessage());
            return true; // fail-open : on ne pénalise pas en cas d'erreur réseau
        }
    }
}
