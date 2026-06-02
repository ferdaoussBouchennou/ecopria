package com.example.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingAccountResponse {
    private Long userId;
    private String email;
    private String role;
    private String name;
    private LocalDateTime createdAt;
}
