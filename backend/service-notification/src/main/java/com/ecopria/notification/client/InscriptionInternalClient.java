package com.ecopria.notification.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class InscriptionInternalClient {

    private final RestTemplate restTemplate;

    @Value("${ecopria.internal.inscription-base-url:http://service-inscription-backend:8084}")
    private String inscriptionBaseUrl;

    public List<Map<String, Object>> listInscriptionsForAction(Long actionId) {
        try {
            String url = inscriptionBaseUrl + "/inscriptions/action/" + actionId;
            ResponseEntity<List<Map<String, Object>>> res = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {});
            return res.getBody() != null ? res.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Inscriptions actionId={} indisponibles : {}", actionId, e.getMessage());
            return Collections.emptyList();
        }
    }
}
