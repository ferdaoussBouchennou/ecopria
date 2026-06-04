package com.example.admin_service.service;

import com.example.admin_service.dto.request.AssociationProfileRequest;
import com.example.admin_service.dto.response.AssociationProfileResponse;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAssociationProfileService {

    private final RestTemplate restTemplate;
    private final LogAdminRepository logAdminRepository;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    @Value("${services.utilisateur-url}")
    private String utilisateurServiceUrl;

    public List<AssociationProfileResponse> listAll() {
        List<Map<String, Object>> rows = restTemplate.exchange(
                actionServiceUrl + "/api/associations/admin",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        ).getBody();
        if (rows == null) {
            return List.of();
        }
        return rows.stream().map(this::mergeWithUtilisateurProfile).toList();
    }

    public AssociationProfileResponse getById(Long id) {
        Map<String, Object> actionRow = restTemplate.getForObject(
                actionServiceUrl + "/api/associations/admin/" + id,
                Map.class
        );
        if (actionRow == null) {
            throw new RuntimeException("Association introuvable: " + id);
        }
        return mergeWithUtilisateurProfile(actionRow);
    }

    @SuppressWarnings("unchecked")
    public AssociationProfileResponse create(AssociationProfileRequest request, Long adminId) {
        Map<String, Object> authBody = new HashMap<>();
        authBody.put("email", request.getEmail().trim());
        authBody.put("name", request.getName().trim());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            authBody.put("password", request.getPassword().trim());
        }

        Map<String, Object> authResponse;
        try {
            authResponse = restTemplate.postForObject(
                    authServiceUrl + "/internal/users/association",
                    authBody,
                    Map.class
            );
        } catch (Exception ex) {
            throw new RuntimeException(
                    "Échec création compte auth (8081) : " + extractUpstreamMessage(ex));
        }
        if (authResponse == null || authResponse.get("userId") == null) {
            throw new RuntimeException("Échec création compte auth association");
        }
        Long userId = ((Number) authResponse.get("userId")).longValue();
        String temporaryPassword = authResponse.get("temporaryPassword") != null
                ? authResponse.get("temporaryPassword").toString()
                : null;

        upsertUtilisateurProfile(userId, request, request.getLogoUrl(), true);

        Map<String, Object> actionBody = buildActionBody(userId, request);
        Map<String, Object> actionRow;
        try {
            actionRow = restTemplate.postForObject(
                    actionServiceUrl + "/api/associations/admin",
                    actionBody,
                    Map.class
            );
        } catch (Exception ex) {
            throw new RuntimeException("Échec création fiche action (9090) : " + rootMessage(ex));
        }
        if (actionRow == null) {
            throw new RuntimeException("Échec création association dans service-action");
        }

        Long associationId = ((Number) actionRow.get("id")).longValue();
        saveLog(adminId, "CREER_ASSOCIATION", associationId, "ASSOCIATION");

        AssociationProfileResponse response = mergeWithUtilisateurProfile(actionRow);
        return AssociationProfileResponse.builder()
                .id(response.getId())
                .userId(response.getUserId())
                .name(response.getName())
                .email(response.getEmail())
                .phone(response.getPhone())
                .address(response.getAddress())
                .city(response.getCity())
                .description(response.getDescription())
                .logoUrl(response.getLogoUrl())
                .validated(response.getValidated())
                .createdAt(response.getCreatedAt())
                .updatedAt(response.getUpdatedAt())
                .temporaryPassword(temporaryPassword)
                .build();
    }

    @SuppressWarnings("unchecked")
    public AssociationProfileResponse update(Long id, AssociationProfileRequest request, Long adminId) {
        Map<String, Object> existing = restTemplate.getForObject(
                actionServiceUrl + "/api/associations/admin/" + id,
                Map.class
        );
        if (existing == null) {
            throw new RuntimeException("Association introuvable: " + id);
        }
        Long userId = ((Number) existing.get("userId")).longValue();

        upsertUtilisateurProfile(userId, request, request.getLogoUrl(), false);

        Map<String, Object> actionBody = buildActionBody(userId, request);
        Map<String, Object> actionRow = restTemplate.exchange(
                actionServiceUrl + "/api/associations/admin/" + id,
                HttpMethod.PUT,
                new HttpEntity<>(actionBody),
                Map.class
        ).getBody();

        saveLog(adminId, "MODIFIER_ASSOCIATION", id, "ASSOCIATION");
        return mergeWithUtilisateurProfile(actionRow != null ? actionRow : existing);
    }

    public Map<String, String> uploadLogo(Long id, MultipartFile logo) throws IOException {
        Map<String, Object> existing = restTemplate.getForObject(
                actionServiceUrl + "/api/associations/admin/" + id,
                Map.class
        );
        if (existing == null) {
            throw new RuntimeException("Association introuvable: " + id);
        }
        Long userId = ((Number) existing.get("userId")).longValue();

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("logo", new ByteArrayResource(logo.getBytes()) {
            @Override
            public String getFilename() {
                String name = logo.getOriginalFilename();
                return name != null && !name.isBlank() ? name : "logo.jpg";
            }
        });
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        Map<String, String> uploadResponse = restTemplate.postForObject(
                utilisateurServiceUrl + "/api/users/association/" + userId + "/logo",
                new HttpEntity<>(body, headers),
                Map.class
        );
        String logoUrl = uploadResponse != null ? uploadResponse.get("logoUrl") : null;
        if (logoUrl == null || logoUrl.isBlank()) {
            throw new RuntimeException("Réponse logo vide du service-utilisateur");
        }

        Map<String, String> logoBody = Map.of("logoUrl", logoUrl);
        restTemplate.put(
                actionServiceUrl + "/api/associations/admin/" + id + "/logo",
                logoBody
        );

        return Map.of("logoUrl", logoUrl);
    }

    private void upsertUtilisateurProfile(
            Long userId,
            AssociationProfileRequest request,
            String logoUrl,
            boolean create) {
        Map<String, Object> body = new HashMap<>();
        body.put("authId", userId);
        body.put("name", request.getName().trim());
        body.put("email", request.getEmail().trim());
        body.put("phone", trimOrNull(request.getPhone()));
        body.put("address", trimOrNull(request.getAddress()));
        body.put("city", trimOrNull(request.getCity()));
        body.put("description", trimOrNull(request.getDescription()));
        if (logoUrl != null && !logoUrl.isBlank()) {
            body.put("logo", logoUrl.trim());
        }

        if (create) {
            try {
                restTemplate.postForObject(
                        utilisateurServiceUrl + "/api/users/admin/associations",
                        body,
                        Map.class
                );
            } catch (Exception ex) {
                try {
                    restTemplate.postForObject(
                            utilisateurServiceUrl + "/internal/associations",
                            body,
                            Map.class
                    );
                } catch (Exception ex2) {
                    throw new RuntimeException(
                            "Échec profil utilisateur (8082). Redémarrez service-utilisateur puis réessayez. "
                                    + rootMessage(ex));
                }
            }
            return;
        }

        try {
            restTemplate.put(
                    utilisateurServiceUrl + "/api/users/admin/associations/" + userId,
                    body
            );
        } catch (Exception ex) {
            restTemplate.put(
                    utilisateurServiceUrl + "/internal/associations/" + userId,
                    body
            );
        }
    }

    private Map<String, Object> buildActionBody(Long userId, AssociationProfileRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("name", request.getName().trim());
        body.put("description", trimOrNull(request.getDescription()));
        body.put("city", trimOrNull(request.getCity()));
        body.put("logoUrl", trimOrNull(request.getLogoUrl()));
        body.put("validated", request.getValidated() == null || request.getValidated());
        return body;
    }

    @SuppressWarnings("unchecked")
    private AssociationProfileResponse mergeWithUtilisateurProfile(Map<String, Object> actionRow) {
        Long userId = actionRow.get("userId") != null ? ((Number) actionRow.get("userId")).longValue() : null;
        Map<String, Object> profile = null;
        if (userId != null) {
            try {
                profile = restTemplate.getForObject(
                        utilisateurServiceUrl + "/api/users/admin/associations/" + userId,
                        Map.class
                );
            } catch (Exception ex) {
                try {
                    profile = restTemplate.getForObject(
                            utilisateurServiceUrl + "/internal/associations/" + userId,
                            Map.class
                    );
                } catch (Exception ex2) {
                    log.warn("Profil utilisateur introuvable pour authId {}: {}", userId, ex.getMessage());
                }
            }
        }

        return AssociationProfileResponse.builder()
                .id(actionRow.get("id") != null ? ((Number) actionRow.get("id")).longValue() : null)
                .userId(userId)
                .name(firstNonBlank(
                        profile != null ? asString(profile.get("name")) : null,
                        asString(actionRow.get("name"))
                ))
                .email(profile != null ? asString(profile.get("email")) : null)
                .phone(profile != null ? asString(profile.get("phone")) : null)
                .address(profile != null ? asString(profile.get("address")) : null)
                .city(firstNonBlank(
                        profile != null ? asString(profile.get("city")) : null,
                        asString(actionRow.get("city"))
                ))
                .description(firstNonBlank(
                        profile != null ? asString(profile.get("description")) : null,
                        asString(actionRow.get("description"))
                ))
                .logoUrl(firstNonBlank(
                        profile != null ? asString(profile.get("logo")) : null,
                        asString(actionRow.get("logoUrl"))
                ))
                .validated(actionRow.get("validated") instanceof Boolean b ? b : Boolean.TRUE.equals(actionRow.get("validated")))
                .createdAt(parseDateTime(actionRow.get("createdAt")))
                .updatedAt(parseDateTime(actionRow.get("updatedAt")))
                .build();
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second != null && !second.isBlank() ? second : null;
    }

    private static LocalDateTime parseDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof List<?> list && list.size() >= 3) {
            try {
                int year = ((Number) list.get(0)).intValue();
                int month = ((Number) list.get(1)).intValue();
                int day = ((Number) list.get(2)).intValue();
                int hour = list.size() > 3 ? ((Number) list.get(3)).intValue() : 0;
                int minute = list.size() > 4 ? ((Number) list.get(4)).intValue() : 0;
                int second = list.size() > 5 ? ((Number) list.get(5)).intValue() : 0;
                return LocalDateTime.of(year, month, day, hour, minute, second);
            } catch (Exception ignored) {
                // fall through
            }
        }
        String raw = value.toString().trim();
        if (raw.isEmpty() || raw.startsWith("[")) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw);
        } catch (Exception ex) {
            try {
                return LocalDateTime.parse(raw, java.time.format.DateTimeFormatter.ISO_DATE_TIME);
            } catch (Exception ignored) {
                return null;
            }
        }
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

    private static String rootMessage(Throwable ex) {
        Throwable current = ex;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current.getMessage() != null ? current.getMessage() : ex.getMessage();
    }

    private static String extractUpstreamMessage(Throwable ex) {
        if (ex instanceof org.springframework.web.client.HttpStatusCodeException httpEx) {
            String body = httpEx.getResponseBodyAsString();
            if (body != null && body.contains("\"message\"")) {
                int marker = body.indexOf("\"message\"");
                int start = body.indexOf(':', marker) + 1;
                int firstQuote = body.indexOf('"', start);
                int secondQuote = body.indexOf('"', firstQuote + 1);
                if (firstQuote >= 0 && secondQuote > firstQuote) {
                    return body.substring(firstQuote + 1, secondQuote);
                }
            }
        }
        return rootMessage(ex);
    }
}
