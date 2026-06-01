package com.example.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailVerificationEvent {

    private Long userId;
    private String email;

    @JsonProperty("first_name")
    private String firstName;

    private String code;
}
