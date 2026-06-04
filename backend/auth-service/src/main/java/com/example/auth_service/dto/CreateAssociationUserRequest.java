package com.example.auth_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAssociationUserRequest {
    @NotBlank
    @Email
    private String email;

    /** Optional — a random password is generated when blank. */
    private String password;

    @NotBlank
    private String name;
}
