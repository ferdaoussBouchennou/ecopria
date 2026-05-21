package com.example.admin_service.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LogAdminResponse {
    private Long id;
    private Long adminId;
    private String action;
    private Long cibleId;
    private String cibleType;
    private LocalDateTime createdAt;
}