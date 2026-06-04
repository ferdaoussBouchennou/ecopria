package com.example.admin_service.dto.request;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategorieRequest {
    @NotBlank private String nom;
    private String description;
    private String imageUrl;
    private Boolean published;
}
