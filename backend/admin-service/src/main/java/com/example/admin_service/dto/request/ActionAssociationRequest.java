package com.example.admin_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ActionAssociationRequest {
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
    private String address;
    private String city;
    private String dateStart;
    private String dateEnd;
    private List<String> program;
    private List<String> practicalInfos;
}
