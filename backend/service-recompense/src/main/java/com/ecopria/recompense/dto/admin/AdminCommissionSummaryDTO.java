package com.ecopria.recompense.dto.admin;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminCommissionSummaryDTO {
    private Double totalCommission;
    private Double currentMonthCommission;
    private Long totalCoupons;
    private List<AdminCommissionMoisDTO> monthlyHistory;
}
