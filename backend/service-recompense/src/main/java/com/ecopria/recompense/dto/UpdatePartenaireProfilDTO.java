package com.ecopria.recompense.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdatePartenaireProfilDTO {
    private String name;
    private String category;
    private String address;
    private String city;
    private String description;
    private String imageUrl;
}
