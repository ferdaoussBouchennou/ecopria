package com.ecopria.recompense.dto.admin;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminCommissionDTO {
    private Long id;
    private Long partenaireId;
    private String partenaireName;
    private String couponCode;
    private String offreTitle;
    private Double valeurDh;
    private Double montantCommission;
    private Double tauxCommission;
    private String moisFacturation;
    private LocalDateTime createdAt;
}
