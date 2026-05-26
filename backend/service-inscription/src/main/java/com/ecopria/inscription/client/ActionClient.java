package com.ecopria.inscription.client;

import com.ecopria.inscription.client.dto.ActionAvailabilityResponse;
import com.ecopria.inscription.dto.ActionDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class ActionClient {

    private final RestTemplate restTemplate;
    private final String actionServiceUrl;

    public ActionClient(@Value("${service.action.url}") String actionServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.actionServiceUrl = actionServiceUrl;
    }

    /**
     * Récupère la disponibilité via GET /api/actions/{id}/disponibilite
     * (directement ou via API Gateway selon {@code service.action.url}).
     */
    public ActionDTO getAction(Long actionId) {
        String base = actionServiceUrl.endsWith("/") ? actionServiceUrl.substring(0, actionServiceUrl.length() - 1) : actionServiceUrl;
        String url = base + "/api/actions/" + actionId + "/disponibilite";
        try {
            ActionAvailabilityResponse availability = restTemplate.getForObject(url, ActionAvailabilityResponse.class);
            if (availability == null) {
                throw new RuntimeException("Action introuvable : id=" + actionId);
            }
            return toActionDTO(availability);
        } catch (RestClientException e) {
            throw new RuntimeException(
                    "Impossible de joindre le service action (" + url + ") : " + e.getMessage(), e);
        }
    }

    private ActionDTO toActionDTO(ActionAvailabilityResponse availability) {
        ActionDTO dto = new ActionDTO();
        dto.setId(availability.getActionId());
        dto.setTitre("Action #" + availability.getActionId());
        dto.setPlacesDisponibles(availability.getAvailablePlaces() != null ? availability.getAvailablePlaces() : 0);
        dto.setPlacesTotales(availability.getMaxParticipants() != null ? availability.getMaxParticipants() : 0);
        dto.setPoints(availability.getPoints() != null ? availability.getPoints() : 0);
        dto.setStatut(availability.getStatus() != null ? availability.getStatus() : "UNKNOWN");
        return dto;
    }
}
