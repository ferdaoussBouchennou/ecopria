package com.ecopria.presence.client;

import com.ecopria.presence.client.dto.ActionDetailResponse;
import com.ecopria.presence.dto.ActionDTO;
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
        dto.setPoints(detail.getPoints() != null ? detail.getPoints() : 0);
        dto.setLatitude(detail.getLatitude());
        dto.setLongitude(detail.getLongitude());
        dto.setStatus(detail.getStatus() != null ? detail.getStatus() : "UNKNOWN");
        return dto;
    }
}
