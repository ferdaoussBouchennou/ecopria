package com.ecopria.presence.client;



import com.ecopria.presence.dto.ActionDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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
            ActionDTO action = restTemplate.getForObject(url, ActionDTO.class);
            if (action == null) throw new RuntimeException("Action introuvable");
            return action;
        } catch (Exception e) {
            // Mock si service-action non disponible
            ActionDTO mock = new ActionDTO();
            mock.setId(actionId);
            mock.setPoints(100);
            mock.setStatus("PUBLISHED");
            return mock;
        }
    }
}
