package com.ecopria.action.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminActionManageRequest {
    @NotBlank
    private String titre;
    private String description;
    @NotBlank
    private String categorie;
    @NotNull
    private Long associationId;
    private String associationName;
    @NotNull
    private Double latitude;
    @NotNull
    private Double longitude;
    @NotNull
    private Integer points;
    private Integer placesTotal;
    private String lieu;
}

