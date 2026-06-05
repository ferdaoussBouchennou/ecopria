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
public class CitizenAccountResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String city;
    private Integer totalPoints;
    private Integer trustScore;
    private LocalDateTime createdAt;
    private Boolean isActive;
    private String status;
}
