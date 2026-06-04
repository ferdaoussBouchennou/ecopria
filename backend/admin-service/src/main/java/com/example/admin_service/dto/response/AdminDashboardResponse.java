package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private long totalUsers;
    private long activeUsers;
    private long newUsersThisWeek;
    private long pendingValidations;
    private long pendingAssociations;
    private long pendingPartenaires;
    private long openFraudAlerts;
    private long supportTickets;
    private double commissionRevenue;
    private long totalActions;
    private long activeActions;
    private long totalInscriptions;
    private long totalRewardsExchanged;
    private long totalPointsDistributed;
    private double commissionRate;
    private List<Long> activityLast30Days;
    private List<PendingRequestItem> pendingRequests;
    private List<LogAdminResponse> recentLogs;
}
