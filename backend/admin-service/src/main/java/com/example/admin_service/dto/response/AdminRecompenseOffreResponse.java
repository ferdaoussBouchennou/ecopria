package com.example.admin_service.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminRecompenseOffreResponse {
    private Long id;
    private Long partenaireId;
    private String partenaireName;
    private String partenaireCategory;
    private String title;
    private String description;
    private String imageUrl;
    private Integer pointsNecessaires;
    private String type;
    private Integer stock;
    private Integer discountPercentage;
    private Double valeurDh;
    private LocalDateTime dateExpiration;
    private Boolean isActive;
    private Boolean isAvailable;
    private Long couponsDistribues;
    private Long couponsUtilises;
    private LocalDateTime createdAt;
}
