package com.example.admin_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActionFixeRequest {
    @NotBlank private String titre;
    private String description;
    @NotBlank private String categorie;
    private String lieu;
    private Double latitude;
    private Double longitude;
    @NotNull private Integer points;
    private Integer placesTotal;
    private String frequence;
}
