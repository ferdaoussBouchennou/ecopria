package com.ecopria.action.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateActionDTO {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200)
    private String title;

    private String description;

    @NotNull(message = "La catégorie est obligatoire")
    private Long categoryId;

    @NotBlank(message = "L'adresse est obligatoire")
    private String address;

    @NotBlank(message = "La ville est obligatoire")
    private String city;

    @NotNull(message = "La latitude est obligatoire")
    private Double latitude;

    @NotNull(message = "La longitude est obligatoire")
    private Double longitude;

    @NotNull(message = "La date de début est obligatoire")
    @Future(message = "La date doit être dans le futur")
    private LocalDateTime dateStart;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDateTime dateEnd;

    @NotNull
    @Min(value = 1, message = "Les points doivent être supérieurs à 0")
    private Integer points;

    @NotNull
    @Min(value = 1, message = "Au moins 1 participant requis")
    private Integer maxParticipants;

    private List<String> program;
    private List<String> practicalInfos;
}