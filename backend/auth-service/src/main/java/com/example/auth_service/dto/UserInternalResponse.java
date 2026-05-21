package com.example.auth_service.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserInternalResponse {
    private Long userId;
    private String email;
    private String role;
    private Boolean isActive;
    private Boolean isVerified;
}