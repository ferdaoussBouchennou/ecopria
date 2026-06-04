package com.ecopria.utilisateur.dto;

import lombok.Data;

@Data
public class BadgeStatusDTO {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private Integer requiredPoints;
    private boolean obtained;
}
