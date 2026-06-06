package com.example.admin_service.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminRecompenseCommissionMoisResponse {
    private String mois;
    private Long couponsUtilises;
    private Double caGenere;
    private Double commission;
}
