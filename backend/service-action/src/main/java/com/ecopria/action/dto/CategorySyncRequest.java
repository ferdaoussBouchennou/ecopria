package com.ecopria.action.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategorySyncRequest {
    /** Nom avant modification (pour renommer sans casser les actions liées). */
    private String previousNom;

    @NotBlank
    private String nom;

    private String description;
    private String imageUrl;
    private Boolean published;
}
