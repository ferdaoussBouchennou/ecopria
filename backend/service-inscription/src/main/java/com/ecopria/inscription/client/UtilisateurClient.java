package com.ecopria.inscription.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Client REST pour récupérer le Trust Score d'un citoyen
 * et le mettre à jour depuis service-inscription.
 */
@Service
public class UtilisateurClient {

    private final RestTemplate restTemplate;
    private final String utilisateurServiceUrl;

    public UtilisateurClient(@Value("${service.utilisateur.url}") String utilisateurServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.utilisateurServiceUrl = utilisateurServiceUrl;
    }

    /**
     * Récupère le Trust Score d'un citoyen (authId = userId).
     * @return score entre 0 et 100, ou 100 si l'utilisateur est introuvable (nouveau citoyen).
     */
    @SuppressWarnings("unchecked")
    public int getTrustScore(Long userId) {
        String base = utilisateurServiceUrl.endsWith("/")
                ? utilisateurServiceUrl.substring(0, utilisateurServiceUrl.length() - 1)
                : utilisateurServiceUrl;
        String url = base + "/api/users/" + userId + "/profile";
        try {
            Map<String, Object> profile = restTemplate.getForObject(url, Map.class);
            if (profile != null && profile.containsKey("trustScore")) {
                Object score = profile.get("trustScore");
                if (score instanceof Integer) return (Integer) score;
                if (score instanceof Number) return ((Number) score).intValue();
            }
            return 100; // défaut pour les nouveaux citoyens
        } catch (RestClientException e) {
            // En cas d'erreur réseau, on accepte (fail-open)
            return 100;
        }
    }

    /**
     * Réduit le Trust Score d'un citoyen (pénalité d'absence : delta = -20).
     */
    public void updateTrustScore(Long userId, int delta) {
        String base = utilisateurServiceUrl.endsWith("/")
                ? utilisateurServiceUrl.substring(0, utilisateurServiceUrl.length() - 1)
                : utilisateurServiceUrl;
        String url = base + "/api/users/" + userId + "/trust-score?delta=" + delta;
        try {
            restTemplate.put(url, null);
        } catch (RestClientException e) {
            // Logguer mais ne pas bloquer le job
            System.err.println("[AbsenceJob] Impossible de mettre à jour le trust score pour userId=" + userId + " : " + e.getMessage());
        }
    }
}
