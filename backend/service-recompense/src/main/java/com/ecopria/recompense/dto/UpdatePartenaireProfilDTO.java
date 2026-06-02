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
    private java.util.List<String> galleryImages;
    private String phone;
    private String website;
    private String instagramUrl;
    private String facebookUrl;
    private String openingHours;
}
