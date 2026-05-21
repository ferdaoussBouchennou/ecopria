package com.example.auth_service.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminVerificationDecisionRequest {
    @NotNull
    private Long userId;

    @NotNull
    private Boolean approved;

    private String nom;
}
