package com.ecopria.action.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryEnsureRequest {
    @NotBlank
    private String nom;
    private String description;
    private String imageUrl;
}
