package com.example.admin_service.service;

import com.example.admin_service.dto.response.AdminDashboardResponse;
import com.example.admin_service.dto.response.LogAdminResponse;
import com.example.admin_service.dto.response.PendingRequestItem;
import com.example.admin_service.model.Configuration;
import com.example.admin_service.repository.ConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {

    private final RestTemplate restTemplate;
    private final AdminLogService adminLogService;
    private final ConfigurationRepository configurationRepository;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    @Value("${services.inscription-url}")
    private String inscriptionServiceUrl;

    @Value("${services.recompense-url}")
    private String recompenseServiceUrl;

    @Value("${services.utilisateur-url}")
    private String utilisateurServiceUrl;

    public AdminDashboardResponse getDashboard() {
        Map<String, Object> authStats = fetchMap(authServiceUrl + "/internal/users/stats");
        Map<String, Object> actionStats = fetchMap(actionServiceUrl + "/internal/stats");
        Map<String, Object> inscriptionStats = fetchMap(inscriptionServiceUrl + "/internal/stats");
        Map<String, Object> recompenseStats = fetchMap(recompenseServiceUrl + "/internal/stats");
        Map<String, Object> utilisateurStats = fetchMap(utilisateurServiceUrl + "/internal/stats");

        List<PendingRequestItem> pendingRequests = fetchPendingRequests();
        List<LogAdminResponse> recentLogs = adminLogService.getRecentLogs(10);
        double commissionRate = resolveCommissionRate();

        return AdminDashboardResponse.builder()
                .totalUsers(extractCount(authStats, "totalUsers"))
                .activeUsers(extractCount(authStats, "activeUsers"))
                .newUsersThisWeek(extractCount(authStats, "newUsersThisWeek"))
                .pendingValidations(extractCount(authStats, "pendingValidations"))
                .pendingAssociations(extractCount(authStats, "pendingAssociations"))
                .pendingPartenaires(extractCount(authStats, "pendingPartenaires"))
                .openFraudAlerts(countOpenFraudAlerts(recentLogs))
                .supportTickets(0L)
                .commissionRevenue(extractDouble(recompenseStats, "commissionRevenue"))
                .totalActions(extractCount(actionStats, "totalActions"))
                .activeActions(extractCount(actionStats, "activeActions"))
                .totalInscriptions(extractCount(inscriptionStats, "totalInscriptions"))
                .totalRewardsExchanged(extractCount(recompenseStats, "totalRewardsExchanged"))
                .totalPointsDistributed(extractCount(utilisateurStats, "totalPointsDistributed"))
                .commissionRate(commissionRate)
                .activityLast30Days(extractLongList(inscriptionStats, "activityLast30Days"))
                .pendingRequests(pendingRequests)
                .recentLogs(recentLogs)
                .build();
    }

    private double resolveCommissionRate() {
        return configurationRepository.findByCle("taux_commission")
                .map(Configuration::getValeur)
                .map(value -> {
                    try {
                        return Double.parseDouble(value);
                    } catch (NumberFormatException ex) {
                        return 15.0;
                    }
                })
                .orElse(15.0);
    }

    private long countOpenFraudAlerts(List<LogAdminResponse> recentLogs) {
        return recentLogs.stream()
                .filter(log -> log.getAction() != null && log.getAction().toUpperCase().contains("FRAUDE"))
                .count();
    }

    @SuppressWarnings("unchecked")
    private List<PendingRequestItem> fetchPendingRequests() {
        try {
            List<Map<String, Object>> rows = restTemplate.getForObject(
                    authServiceUrl + "/internal/users/pending-accounts",
                    List.class
            );
            if (rows == null) {
                return List.of();
            }
            List<PendingRequestItem> items = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                items.add(PendingRequestItem.builder()
                        .userId(extractLong(row, "userId"))
                        .label(String.valueOf(row.getOrDefault("name", "Compte")))
                        .role(String.valueOf(row.getOrDefault("role", "")))
                        .createdAt(parseDateTime(row.get("createdAt")))
                        .build());
            }
            return items.stream().limit(5).toList();
        } catch (Exception e) {
            log.warn("Pending accounts unavailable: {}", e.getMessage());
            return List.of();
        }
    }

    private Map<String, Object> fetchMap(String endpoint) {
        try {
            Map<String, Object> response = restTemplate.getForObject(endpoint, Map.class);
            return response != null ? response : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Dashboard endpoint unavailable: {}", endpoint);
            return Collections.emptyMap();
        }
    }

    private long extractCount(Map<String, Object> response, String field) {
        Object rawValue = response.get(field);
        if (rawValue instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    private double extractDouble(Map<String, Object> response, String field) {
        Object rawValue = response.get(field);
        if (rawValue instanceof Number number) {
            return number.doubleValue();
        }
        return 0.0;
    }

    private Long extractLong(Map<String, Object> response, String field) {
        Object rawValue = response.get(field);
        if (rawValue instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private List<Long> extractLongList(Map<String, Object> response, String field) {
        Object rawValue = response.get(field);
        if (!(rawValue instanceof List<?> list)) {
            return List.of();
        }
        List<Long> values = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Number number) {
                values.add(number.longValue());
            }
        }
        return values;
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
