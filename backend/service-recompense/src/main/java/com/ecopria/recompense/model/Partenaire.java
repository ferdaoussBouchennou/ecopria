package com.ecopria.recompense.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "partenaires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partenaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // reçu via Kafka user.inscrit depuis service-auth
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(length = 100)
    private String city;

    @Column(length = 255)
    private String address;

    // catégorie du partenaire ex: Restauration, Mode, Mobilité
    @Column(length = 100)
    private String category;

    // commission appliquée — 10% par défaut
    @Column(nullable = false)
    @Builder.Default
    private Double commissionRate = 10.0;

    // mis à true via Kafka compte.valide depuis service-admin
    @Column(name = "is_validated", nullable = false)
    @Builder.Default
    private Boolean isValidated = false;

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
}