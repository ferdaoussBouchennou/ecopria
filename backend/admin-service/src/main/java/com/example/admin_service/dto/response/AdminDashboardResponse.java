package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private long totalUsers;
    private long newUsersThisWeek;
    private long totalActions;
    private long activeActions;
    private long totalInscriptions;
    private long totalRewardsExchanged;
    private long pendingAssociations;
    private List<LogAdminResponse> recentLogs;
}
