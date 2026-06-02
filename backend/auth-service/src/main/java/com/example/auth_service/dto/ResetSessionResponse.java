package com.example.auth_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResetSessionResponse {
    private String resetToken;
    private String message;
}
