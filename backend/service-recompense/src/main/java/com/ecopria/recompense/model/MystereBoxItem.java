package com.ecopria.recompense.model;

import jakarta.persistence.*;
import lombok.*;

// Représente UNE option possible à l'intérieur de la boîte mystère d'une offre
@Entity
@Table(name = "mystere_box_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MystereBoxItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // L'offre principale qui possède cette boîte
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recompense_id", nullable = false)
    private Recompense recompense;

    // Titre de cette option cachée (ex: "-5% seulement", "-50% exceptionnel")
    @Column(nullable = false, length = 200)
    private String titre;

    // Description de cette option (optionnelle)
    @Column(columnDefinition = "TEXT")
    private String description;

    // Probabilité en % de tomber sur cette option (ex: 60 = 60%)
    // La somme de tous les items d'une même offre doit être = 100
    @Column(nullable = false)
    private Integer probabilite;
}
