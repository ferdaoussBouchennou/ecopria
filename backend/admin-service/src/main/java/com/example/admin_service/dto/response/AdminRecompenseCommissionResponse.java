package com.example.admin_service.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminRecompenseCommissionResponse {
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
