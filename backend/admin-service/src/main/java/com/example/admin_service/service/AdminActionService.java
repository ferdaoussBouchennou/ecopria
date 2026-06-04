package com.example.admin_service.service;

import com.example.admin_service.dto.request.ActionAssociationRequest;
import com.example.admin_service.dto.response.AssociationOptionResponse;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminActionService {

    private final LogAdminRepository logAdminRepository;
    private final RestTemplate restTemplate;
    private final CategorySyncService categorySyncService;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    public List<AssociationOptionResponse> getAssociations() {
        List<AssociationOptionResponse> list = restTemplate.exchange(
                actionServiceUrl + "/api/actions/admin/associations",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<AssociationOptionResponse>>() {}
        ).getBody();
        return list != null ? list : List.of();
    }

    public List<?> getAll() {
        List<?> actions = restTemplate.getForObject(
                actionServiceUrl + "/api/actions/admin/manage",
                List.class
        );
        return actions != null ? actions : List.of();
    }

    public Map<String, Object> getById(Long actionId) {
        Map<String, Object> detail = restTemplate.getForObject(
                actionServiceUrl + "/api/actions/admin/manage/" + actionId,
                Map.class
        );
        if (detail == null) {
            throw new RuntimeException("Action introuvable: " + actionId);
        }
        return detail;
    }

    public Map<String, String> uploadPhoto(Long actionId, MultipartFile photo) throws IOException {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("photo", new ByteArrayResource(photo.getBytes()) {
            @Override
            public String getFilename() {
                String name = photo.getOriginalFilename();
                return name != null && !name.isBlank() ? name : "photo.jpg";
            }
        });
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        String url = actionServiceUrl + "/api/actions/admin/manage/" + actionId + "/photo";
        Map<String, String> response = restTemplate.postForObject(
                url,
                new HttpEntity<>(body, headers),
                Map.class
        );
        if (response == null) {
            throw new RuntimeException("Réponse vide du service-action");
        }
        return response;
    }

    public Object create(ActionAssociationRequest request, Long adminId) {
        request.setCategorie(categorySyncService.ensureCategoryExists(request.getCategorie(), adminId));
        Object created = restTemplate.postForObject(
                actionServiceUrl + "/api/actions/admin/manage",
                request,
                Map.class
        );
        Long cibleId = extractLong(created, "id");
        saveLog(adminId, "CREER_ACTION", cibleId, "ACTION");
        return created;
    }

    public void update(Long actionId, ActionAssociationRequest request, Long adminId) {
        request.setCategorie(categorySyncService.ensureCategoryExists(request.getCategorie(), adminId));
        restTemplate.put(actionServiceUrl + "/api/actions/admin/manage/" + actionId, request);
        saveLog(adminId, "MODIFIER_ACTION", actionId, "ACTION");
    }

    public void activate(Long actionId, Long adminId) {
        restTemplate.put(actionServiceUrl + "/api/actions/admin/manage/" + actionId + "/activate", null);
        saveLog(adminId, "ACTIVER_ACTION", actionId, "ACTION");
    }

    public void deactivate(Long actionId, String raison, Long adminId) {
        restTemplate.put(actionServiceUrl + "/api/actions/admin/manage/" + actionId + "/deactivate", null);
        saveLog(adminId, "DESACTIVER_ACTION", actionId, "ACTION");
    }

    private void saveLog(Long adminId, String action, Long cibleId, String cibleType) {
        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action(action)
                .cibleId(cibleId)
                .cibleType(cibleType)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @SuppressWarnings("unchecked")
    private Long extractLong(Object source, String key) {
        if (!(source instanceof Map<?, ?> map)) {
            return null;
        }
        Object value = ((Map<String, Object>) map).get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }
}
