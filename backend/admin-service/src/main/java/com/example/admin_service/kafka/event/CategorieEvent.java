package com.example.admin_service.kafka.event;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategorieEvent {
    private String nom;
    /** Nom avant renommage (sync db_action sans supprimer la catégorie). */
    private String previousNom;
    private String description;
    private String imageUrl;
    private Boolean published;
}
