package com.ecopria.recompense.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RepondreAvisDTO {
    @NotBlank
    private String reponse;
}
