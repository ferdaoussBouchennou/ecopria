package com.ecopria.utilisateur.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CitizenDTO {
    @JsonProperty("auth_id")
    private Long authId;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @Size(max = 10, message = "Le numéro de téléphone ne doit pas dépasser 10 chiffres")
    @Pattern(regexp = "^[0-9]*$", message = "Le numéro de téléphone ne doit contenir que des chiffres")
    private String phone;

    private String city;
    private String address;
    private String email;
    private String photo;
}
