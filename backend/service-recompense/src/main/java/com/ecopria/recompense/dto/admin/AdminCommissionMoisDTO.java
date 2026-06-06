package com.ecopria.recompense.dto.admin;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminCommissionMoisDTO {
    private String mois;
    private Long couponsUtilises;
    private Double caGenere;
    private Double commission;
}
