package com.example.admin_service.service;

import com.example.admin_service.dto.response.AdminDashboardResponse;
import com.example.admin_service.dto.response.LogAdminResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {

    private final RestTemplate restTemplate;
    private final AdminLogService adminLogService;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    @Value("${services.action-url}")
    private String actionServiceUrl;

    @Value("${services.inscription-url}")
    private String inscriptionServiceUrl;

    @Value("${services.recompense-url}")
    private String recompenseServiceUrl;

    public AdminDashboardResponse getDashboard() {
        long totalUsers = extractCount(authServiceUrl + "/internal/users/stats", "totalUsers");
        long newUsersThisWeek = extractCount(authServiceUrl + "/internal/users/stats", "newUsersThisWeek");
        long totalActions = extractCount(actionServiceUrl + "/internal/dashboard/stats", "totalActions");
        long activeActions = extractCount(actionServiceUrl + "/internal/dashboard/stats", "activeActions");
        long pendingAssociations = extractCount(actionServiceUrl + "/internal/dashboard/stats", "pendingAssociations");
        long totalInscriptions = extractCount(inscriptionServiceUrl + "/internal/dashboard/stats", "totalInscriptions");
        long totalRewardsExchanged = extractCount(recompenseServiceUrl + "/internal/dashboard/stats", "totalRewardsExchanged");

        List<LogAdminResponse> recentLogs = adminLogService.getRecentLogs(10);

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .newUsersThisWeek(newUsersThisWeek)
                .totalActions(totalActions)
                .activeActions(activeActions)
                .totalInscriptions(totalInscriptions)
                .totalRewardsExchanged(totalRewardsExchanged)
                .pendingAssociations(pendingAssociations)
                .recentLogs(recentLogs)
                .build();
    }

    private long extractCount(String endpoint, String field) {
        try {
            Map<String, Object> response = restTemplate.getForObject(endpoint, Map.class);
            if (response == null) {
                return 0L;
            }
            Object rawValue = response.get(field);
            if (rawValue instanceof Number number) {
                return number.longValue();
            }
            return 0L;
        } catch (Exception e) {
            log.warn("Dashboard endpoint unavailable: {}", endpoint);
            return 0L;
        }
    }
}
