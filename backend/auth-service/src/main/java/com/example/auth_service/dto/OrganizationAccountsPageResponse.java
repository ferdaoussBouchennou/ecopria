package com.example.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationAccountsPageResponse {
    private long pendingCount;
    private long approvedCount;
    private long rejectedCount;
    private long totalCount;
    private List<OrganizationAccountResponse> items;
}