package com.example.admin_service.dto.response;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminRecompenseCommissionSummaryResponse {
    private Double totalCommission;
    private Double currentMonthCommission;
    private Long totalCoupons;
    private List<AdminRecompenseCommissionMoisResponse> monthlyHistory;
}
