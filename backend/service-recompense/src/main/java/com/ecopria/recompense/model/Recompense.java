package com.ecopria.recompense.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recompenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recompense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "points_necessaires", nullable = false)
    private Integer pointsNecessaires;

    // STOCK = objet physique avec stock limité
    // REDUCTION = réduction sans stock
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecompenseType type;

    // null si type = REDUCTION / SERVICE
    @Column(nullable = true)
    private Integer stock;

    // null si type = STOCK / SERVICE / EXPERIENCE
    // ex: 15 pour 15% de réduction
    @Column(name = "discount_percentage", nullable = true)
    private Integer discountPercentage;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // valeur en DH pour calculer la commission
    @Column(name = "valeur_dh", nullable = true)
    private Double valeurDh;

    // Date limite de validité de l'offre (optionnelle)
    @Column(name = "date_expiration")
    private LocalDateTime dateExpiration;

    // ── BOÎTE MYSTÈRE (optionnelle) ──────────────────────────
    // Offre principale = visible catalogue (title, image, pointsNecessaires).
    // Boîte mystère = tirage parmi ≥2 offres secrètes (non exposées au public).
    @Column(name = "has_mystere_box", nullable = false)
    @Builder.Default
    private Boolean hasMystereBox = false;

    // Coût en points de la boîte mystère (souvent moins cher que l'offre normale)
    @Column(name = "mystere_box_points")
    private Integer mystereBoxPoints;

    // Les options cachées dans la boîte mystère
    @OneToMany(mappedBy = "recompense", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MystereBoxItem> mystereBoxItems = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // calculé — pas stocké en BD
    public Boolean isAvailable() {
        if (!isActive) return false;
        if (dateExpiration != null && dateExpiration.isBefore(LocalDateTime.now())) {
            return false;
        }
        return switch (type) {
            // objet physique : disponible si stock > 0
            case STOCK -> stock != null && stock > 0;
            // réduction : toujours disponible si active
            case REDUCTION -> true;
            // prestation (livraison, consultation...) : toujours disponible si active
            case SERVICE -> true;
            // expérience limitée dans le temps : disponible si encore du stock
            case EXPERIENCE -> stock == null || stock > 0;
        };
    }

    public enum RecompenseType {
        STOCK,      // objet physique avec stock limité
        REDUCTION,  // pourcentage de réduction sur achat
        SERVICE,    // prestation gratuite (livraison, consultation, etc.)
        EXPERIENCE  // expérience unique (atelier, visite, événement...)
    }
}