package com.ecopria.recompense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalStatsResponse {
    private long totalRewardsExchanged;
    private double commissionRevenue;
}
