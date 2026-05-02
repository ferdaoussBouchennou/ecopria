package com.example.admin_service.dto.request;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategorieRequest {
    @NotBlank private String name;
    private String description;
    private String imageUrl;
}
