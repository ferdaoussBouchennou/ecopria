package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationAccountResponse {
    private Long userId;
    private String email;
    private String role;
    private String name;
    private String documentPath;
    private Boolean hasStoredDocument;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private String status;
    private Boolean isActive;
}