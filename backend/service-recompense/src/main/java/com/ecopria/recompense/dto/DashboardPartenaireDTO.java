package com.ecopria.recompense.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardPartenaireDTO {
    private String partenaireName;
    private Long vuesProfil;
    private Long clicsOffres;
    private Double tauxClic;
    private Long couponsDistribues;
    private Long couponsUtilises;
    private Double tauxUtilisation;
    private Double noteMoyenne;
    private Long nombreAvis;
    private Double commissionsARegler;
    private Double commissionRate;  // Taux de commission du partenaire (ex: 15.0 pour 15%)
    private String badgeActuel;
    private List<RecompenseDTO> offresActives;
    private List<CouponDTO> echangesRecents;
}
