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
    private Long couponsDistribues;
    private Long couponsUtilises;
    private Double tauxUtilisation; // calculé
    private Double commissionsARegler; // mois en cours
    private List<RecompenseDTO> offresActives;
    private List<CouponDTO> echangesRecents;
}