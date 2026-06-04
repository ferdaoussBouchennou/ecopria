package com.example.admin_service.service;

import com.example.admin_service.dto.response.ModerationActionResponse;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminModerationService {

    private final RestTemplate restTemplate;
    private final LogAdminRepository logAdminRepository;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    public List<ModerationActionResponse> listActions() {
        List<Map<String, Object>> raw = restTemplate.exchange(
                actionServiceUrl + "/api/actions/admin/manage",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        ).getBody();

        if (raw == null) {
            return List.of();
        }
        return raw.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void activate(Long actionId, Long adminId) {
        restTemplate.put(actionServiceUrl + "/api/actions/admin/manage/" + actionId + "/activate", null);
        saveLog(adminId, "MODERATION_PUBLIER", actionId);
    }

    public void deactivate(Long actionId, String raison, Long adminId) {
        restTemplate.put(actionServiceUrl + "/api/actions/admin/manage/" + actionId + "/deactivate", null);
        saveLog(adminId, "MODERATION_SUSPENDRE", actionId);
    }

    private ModerationActionResponse toResponse(Map<String, Object> row) {
        return ModerationActionResponse.builder()
                .id(asLong(row.get("id")))
                .title(asString(row.get("title")))
                .categoryName(asString(row.get("categoryName")))
                .categoryImageUrl(asString(row.get("categoryImageUrl")))
                .city(asString(row.get("city")))
                .dateStart(asString(row.get("dateStart")))
                .dateEnd(asString(row.get("dateEnd")))
                .points(asInt(row.get("points")))
                .availablePlaces(asInt(row.get("availablePlaces")))
                .maxParticipants(asInt(row.get("maxParticipants")))
                .registeredCount(asInt(row.get("registeredCount")))
                .isFixed(asBoolean(row.get("isFixed")))
                .status(asString(row.get("status")))
                .associationName(asString(row.get("associationName")))
                .photoUrls(asStringList(row.get("photoUrls")))
                .build();
    }

    private void saveLog(Long adminId, String action, Long cibleId) {
        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action(action)
                .cibleId(cibleId)
                .cibleType("ACTION")
                .createdAt(LocalDateTime.now())
                .build());
    }

    private static Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private static Integer asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private static Boolean asBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return null;
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    @SuppressWarnings("unchecked")
    private static List<String> asStringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(Object::toString).collect(Collectors.toList());
        }
        return List.of();
    }
}
