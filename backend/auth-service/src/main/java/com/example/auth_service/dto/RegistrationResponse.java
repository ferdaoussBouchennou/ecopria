package com.example.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegistrationResponse {

    @JsonProperty("requires_email_verification")
    private boolean requiresEmailVerification;

    private Long userId;
    private String email;
    private String message;
}
