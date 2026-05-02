package com.ecopria.inscription.client;

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

    public ActionDTO getAction(Long actionId) {
        try {
            String url = actionServiceUrl + "/actions/" + actionId;
            System.out.println("Appel REST vers service-action : " + url);
            ActionDTO action = restTemplate.getForObject(url, ActionDTO.class);
            if (action == null) throw new RuntimeException("Action introuvable : id=" + actionId);
            return action;
        } catch (RestClientException e) {
            System.out.println("service-action non disponible, utilisation du mock. Erreur: " + e.getMessage());
            return getMockAction(actionId);
        }
    }

    private ActionDTO getMockAction(Long actionId) {
        ActionDTO mock = new ActionDTO();
        mock.setId(actionId);
        mock.setTitre("Action écologique test #" + actionId);
        mock.setPlacesDisponibles(10);
        mock.setPlacesTotales(20);
        mock.setPoints(100);
        mock.setStatut("ACTIVE");
        return mock;
    }
}