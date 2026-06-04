package com.ecopria.inscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalStatsResponse {
    private long totalInscriptions;
    private List<Long> activityLast30Days;
}
