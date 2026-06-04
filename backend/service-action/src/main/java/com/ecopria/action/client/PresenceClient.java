package com.ecopria.action.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PresenceClient {

    private final RestTemplate restTemplate;
    private final String presenceServiceUrl;

    public PresenceClient(@Value("${service.presence.url:http://localhost:8085}") String presenceServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.presenceServiceUrl = presenceServiceUrl.endsWith("/")
                ? presenceServiceUrl.substring(0, presenceServiceUrl.length() - 1)
                : presenceServiceUrl;
    }

    public Map<Long, Integer> pointsByAction(List<Long> actionIds) {
        if (actionIds == null || actionIds.isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            StringBuilder url = new StringBuilder(presenceServiceUrl)
                    .append("/presences/stats/points?actionIds=");
            for (int i = 0; i < actionIds.size(); i++) {
                if (i > 0) {
                    url.append('&');
                }
                url.append(actionIds.get(i));
            }
            Map<String, Object> body = restTemplate.getForObject(url.toString(), Map.class);
            if (body == null) {
                return Collections.emptyMap();
            }
            Object byAction = body.get("byAction");
            if (!(byAction instanceof Map<?, ?> raw)) {
                return Collections.emptyMap();
            }
            Map<Long, Integer> result = new HashMap<>();
            raw.forEach((k, v) -> {
                Long id = k instanceof Number n ? n.longValue() : Long.parseLong(String.valueOf(k));
                int pts = v instanceof Number num ? num.intValue() : 0;
                result.put(id, pts);
            });
            return result;
        } catch (RestClientException e) {
            return Collections.emptyMap();
        }
    }

    public int sumPointsForActions(List<Long> actionIds) {
        return pointsByAction(actionIds).values().stream().mapToInt(Integer::intValue).sum();
    }

    public int pointsForAction(Long actionId) {
        return pointsByAction(List.of(actionId)).getOrDefault(actionId, 0);
    }
}
