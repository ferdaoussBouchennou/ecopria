package com.ecopria.utilisateur.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class PointsDTO {
    @JsonProperty("auth_id")
    private Long authId;
    private Integer points;
    private Long actionId;
    private String source;
}