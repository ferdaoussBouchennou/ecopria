package com.ecopria.recompense.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionMensuelleDTO {
    private String mois;
    private Long couponsUtilises;
    private Double caGenere;
    private Double commission;
}