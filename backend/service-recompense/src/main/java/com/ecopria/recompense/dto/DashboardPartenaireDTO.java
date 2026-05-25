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
    private Long vuesProfilPublic;
    private Long clicsVersOffres;
    private Long couponsDistribues;
    private Long couponsUtilises;
    private Double tauxUtilisation;
    private Double noteMoyenne;
    private Long nombreAvis;
    private Double commissionsARegler;
    private String badgeActuel;
    private List<RecompenseDTO> offresActives;
    private List<CouponDTO> echangesRecents;
}
