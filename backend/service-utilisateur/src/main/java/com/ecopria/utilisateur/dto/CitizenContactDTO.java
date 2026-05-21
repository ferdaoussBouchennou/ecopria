package com.ecopria.utilisateur.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CitizenContactDTO {
    private Long authId;
    private String email;
    private String firstName;
}
