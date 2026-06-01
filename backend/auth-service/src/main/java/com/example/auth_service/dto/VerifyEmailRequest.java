package com.example.auth_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyEmailRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "Le code doit contenir 6 chiffres")
    private String code;
}
