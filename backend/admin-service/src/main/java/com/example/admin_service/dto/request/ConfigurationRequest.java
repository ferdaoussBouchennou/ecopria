package com.example.admin_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfigurationRequest {
    @NotBlank private String valeur;
    private String description;
}
