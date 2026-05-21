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

    @Value("${services.utilisateur-url}")
    private String utilisateurServiceUrl;

    public AdminDashboardResponse getDashboard() {
        long totalUsers = extractCount(authServiceUrl + "/internal/users/stats", "totalUsers");
        long newUsersThisWeek = extractCount(authServiceUrl + "/internal/users/stats", "newUsersThisWeek");
        long pendingAssociations = extractCount(utilisateurServiceUrl + "/internal/associations/stats", "pendingAssociations");
        long totalActions = 0L;
        long activeActions = 0L;
        long totalInscriptions = 0L;
        long totalRewardsExchanged = 0L;

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
