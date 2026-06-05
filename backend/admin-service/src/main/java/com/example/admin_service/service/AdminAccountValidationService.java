package com.example.admin_service.service;

import com.example.admin_service.dto.response.OrganizationAccountResponse;
import com.example.admin_service.dto.response.OrganizationAccountsPageResponse;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAccountValidationService {

    private final RestTemplate restTemplate;
    private final LogAdminRepository logAdminRepository;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    public ResponseEntity<byte[]> getVerificationDocument(Long userId) {
        ResponseEntity<byte[]> response = restTemplate.getForEntity(
                authServiceUrl + "/internal/users/" + userId + "/verification-document",
                byte[].class
        );
        HttpHeaders headers = new HttpHeaders();
        if (response.getHeaders().getContentType() != null) {
            headers.setContentType(response.getHeaders().getContentType());
        } else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }
        if (response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION) != null) {
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
        }
        return ResponseEntity.status(response.getStatusCode())
                .headers(headers)
                .body(response.getBody());
    }

    @SuppressWarnings("unchecked")
    public OrganizationAccountsPageResponse getAccounts(String filter) {
        String rejectedCsv = loadRejectedUserIds().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        String url = authServiceUrl + "/internal/users/organization-accounts?status="
                + (filter == null ? "pending" : filter)
                + "&rejectedIds=" + rejectedCsv;

        Map<String, Object> page = restTemplate.getForObject(url, Map.class);
        if (page == null) {
            return emptyPage();
        }

        List<OrganizationAccountResponse> items = new ArrayList<>();
        Object rawItems = page.get("items");
        if (rawItems instanceof List<?> list) {
            for (Object row : list) {
                if (row instanceof Map<?, ?> map) {
                    items.add(mapToItem((Map<String, Object>) map));
                }
            }
        }

        return OrganizationAccountsPageResponse.builder()
                .pendingCount(extractLong(page, "pendingCount"))
                .approvedCount(extractLong(page, "approvedCount"))
                .rejectedCount(extractLong(page, "rejectedCount"))
                .totalCount(extractLong(page, "totalCount"))
                .items(items)
                .build();
    }

    private Set<Long> loadRejectedUserIds() {
        Set<Long> ids = new HashSet<>();
        logAdminRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(log -> log.getAction() != null && log.getAction().startsWith("REJETER_"))
                .filter(log -> log.getCibleId() != null)
                .forEach(log -> ids.add(log.getCibleId()));
        return ids;
    }

    private OrganizationAccountResponse mapToItem(Map<String, Object> row) {
        return OrganizationAccountResponse.builder()
                .userId(extractLongObject(row, "userId"))
                .email(asString(row.get("email")))
                .role(asString(row.get("role")))
                .name(asString(row.get("name")))
                .documentPath(asString(row.get("documentPath")))
                .hasStoredDocument(extractBoolean(row.get("hasStoredDocument")))
                .rejectionReason(asString(row.get("rejectionReason")))
                .createdAt(parseDateTime(row.get("createdAt")))
                .status(normalizeStatus(asString(row.get("status"))))
                .build();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "En attente";
        }
        return switch (status.toLowerCase()) {
            case "validé", "valide", "approved" -> "Validé";
            case "rejeté", "rejete", "rejected" -> "Rejeté";
            default -> status;
        };
    }

    private OrganizationAccountsPageResponse emptyPage() {
        return OrganizationAccountsPageResponse.builder()
                .pendingCount(0)
                .approvedCount(0)
                .rejectedCount(0)
                .totalCount(0)
                .items(List.of())
                .build();
    }

    private long extractLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    private Long extractLongObject(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
    }

    private boolean extractBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return value != null && Boolean.parseBoolean(value.toString());
    }

    private LocalDateTime parseDateTime(Object rawValue) {
        if (rawValue == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(rawValue.toString());
        } catch (Exception ex) {
            return null;
        }
    }
}