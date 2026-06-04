package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long userId;
    private String email;
    private String role;
    private Boolean isActive;
    private Boolean isVerified;
    private String displayName;
    private String createdAt;
}
