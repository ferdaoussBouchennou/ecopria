package com.ecopria.recompense.dto.admin;

import com.ecopria.recompense.model.Recompense.RecompenseType;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminOffreDTO {
    private Long id;
    private Long partenaireId;
    private String partenaireName;
    private String partenaireCategory;
    private String title;
    private String description;
    private String imageUrl;
    private Integer pointsNecessaires;
    private RecompenseType type;
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
