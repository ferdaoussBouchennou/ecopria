package com.ecopria.recompense.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EchangerRecompenseDTO {

    @NotNull(message = "L'ID de la récompense est obligatoire")
    private Long recompenseId;
}