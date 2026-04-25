package com.ecopria.utilisateur.dto;
import lombok.Data;

@Data
public class PointsDTO {
    private Long userId;
    private Integer points;
    private Long actionId;
    private String source;
}