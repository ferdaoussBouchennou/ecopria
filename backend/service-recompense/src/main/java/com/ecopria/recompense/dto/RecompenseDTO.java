package com.ecopria.recompense.dto;

import com.ecopria.recompense.model.Recompense.RecompenseType;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecompenseDTO {
    private Long id;
    private Long partenaireId;
    private String partenaireName;
    private String partenaireCategory;
    private String title;
    private String description;
    private String imageUrl;
    private Integer pointsNecessaires;
    private RecompenseType type;
    private Integer stock;              // STOCK / EXPERIENCE (optionnel)
    private Integer discountPercentage; // REDUCTION uniquement
    private Double  valeurDh;           // SERVICE / EXPERIENCE : valeur pour commissions
    private LocalDateTime dateExpiration; // Date limite de validité de l'offre
    private Boolean isAvailable;        // calculé dynamiquement
    private Boolean isActive;
}