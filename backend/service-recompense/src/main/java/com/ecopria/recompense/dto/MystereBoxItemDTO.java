package com.ecopria.recompense.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

// DTO pour créer/modifier les items de la boîte mystère
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MystereBoxItemDTO {

    private Long id; // null si nouveau, renseigné si existant

    @NotBlank(message = "Le titre de l'option est obligatoire")
    @Size(max = 200)
    private String titre;

    private String description;

    @NotNull(message = "La probabilité est obligatoire")
    @Min(value = 1, message = "La probabilité doit être au moins 1%")
    @Max(value = 100, message = "La probabilité ne peut pas dépasser 100%")
    private Integer probabilite;
}
