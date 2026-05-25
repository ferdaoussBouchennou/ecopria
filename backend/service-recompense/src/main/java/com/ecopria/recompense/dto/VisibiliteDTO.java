package com.ecopria.recompense.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VisibiliteDTO {
    private Long vuesProfil;
    private Long clicsOffres;
    private Double tauxClic;
    private Double noteMoyenne;
    private Long nombreAvis;
    private Long couponsDistribues;
    private Long couponsUtilises;
    private Double tauxConversion;
    private String badgeActuel;
    private List<BadgeProgressionDTO> progressionBadges;
}
