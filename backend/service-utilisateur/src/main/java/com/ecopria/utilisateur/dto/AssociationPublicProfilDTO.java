package com.ecopria.utilisateur.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssociationPublicProfilDTO {
    private Long id;
    private Long authId;
    private String name;
    private String city;
    private String address;
    private String description;
    private String logo;
}
