package com.ecopria.inscription.client;

import com.ecopria.inscription.client.dto.ActionDetailResponse;
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
        String url = base + "/api/actions/" + actionId;
        try {
            ActionDetailResponse detail = restTemplate.getForObject(url, ActionDetailResponse.class);
            if (detail == null) {
                throw new RuntimeException("Action introuvable : id=" + actionId);
            }
            return toActionDTO(detail);
        } catch (RestClientException e) {
            throw new RuntimeException(
                    "Impossible de joindre le service action (" + url + ") : " + e.getMessage(), e);
        }
    }

    private ActionDTO toActionDTO(ActionDetailResponse detail) {
        ActionDTO dto = new ActionDTO();
        dto.setId(detail.getId());
        dto.setTitre(detail.getTitle());
        dto.setPlacesDisponibles(detail.getAvailablePlaces() != null ? detail.getAvailablePlaces() : 0);
        dto.setPlacesTotales(detail.getMaxParticipants() != null ? detail.getMaxParticipants() : 0);
        dto.setPoints(detail.getPoints() != null ? detail.getPoints() : 0);
        dto.setStatut(detail.getStatus() != null ? detail.getStatus() : "UNKNOWN");
        dto.setCity(detail.getCity());
        dto.setAddress(detail.getAddress());
        dto.setAssociationId(detail.getAssociationId());
        dto.setAssociationUserId(detail.getAssociationUserId());
        dto.setDateStart(detail.getDateStart() != null ? detail.getDateStart().toString() : null);
        return dto;
    }
}
