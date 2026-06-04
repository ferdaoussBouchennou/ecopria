package com.ecopria.action.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

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
    /** @deprecated préférer address + city */
    private String lieu;
    private String address;
    private String city;
    /** ISO-8601 local, ex. 2026-06-05T10:00 */
    private String dateStart;
    private String dateEnd;
    private List<String> program;
    private List<String> practicalInfos;
}
