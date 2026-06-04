package com.example.auth_service.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateAssociationUserResponse {
    private Long userId;
    private String email;
    /** Returned only when a password was auto-generated (admin must communicate it). */
    private String temporaryPassword;
}
