package com.ecopria.recompense.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BadgeProgressionDTO {
    private String nom;
    private int seuil;
    private long actuel;
    private int pourcentage;
    private boolean atteint;
}
