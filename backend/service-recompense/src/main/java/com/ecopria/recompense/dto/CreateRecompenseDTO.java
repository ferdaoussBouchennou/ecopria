package com.ecopria.recompense.dto;

import com.ecopria.recompense.model.Recompense.RecompenseType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRecompenseDTO {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200)
    private String title;

    private String description;
    private String imageUrl;

    @NotNull(message = "Les points sont obligatoires")
    @Min(value = 1)
    private Integer pointsNecessaires;

    @NotNull(message = "Le type est obligatoire")
    private RecompenseType type;

    // obligatoire si type = STOCK
    private Integer stock;

    // obligatoire si type = REDUCTION
    @Min(value = 1)
    @Max(value = 100)
    private Integer discountPercentage;

    // valeur en Dirham pour calculer la commission
    private Double valeurDh;

    // date d'expiration de l'offre (optionnelle)
    private LocalDateTime dateExpiration;

    // ── BOÎTE MYSTÈRE (optionnelle) ──────────────────────────
    // Mettre à true si le partenaire veut ajouter une boîte mystère à cette offre
    private Boolean hasMystereBox = false;

    // Coût en points de la boîte (généralement inférieur à pointsNecessaires)
    @Min(value = 1)
    private Integer mystereBoxPoints;

    // Les options cachées dans la boîte (au moins 2 si hasMystereBox = true)
    // La somme des probabilités doit égaler 100
    @Valid
    private List<MystereBoxItemDTO> mystereBoxItems;
}