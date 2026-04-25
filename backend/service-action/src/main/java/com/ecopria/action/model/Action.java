package com.ecopria.action.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Action {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Categorie category;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 255)
    private String address;

    // ville séparée pour les filtres et l'affichage carte
    @Column(length = 100)
    private String city;

    @Column(name = "date_start", nullable = false)
    private LocalDateTime dateStart;

    @Column(name = "date_end", nullable = false)
    private LocalDateTime dateEnd;

    @Column(nullable = false)
    private Integer points;

    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants;

    // places restantes — mis à jour via Kafka inscription.confirmee
    // et inscription.annulee
    @Column(name = "available_places", nullable = false)
    private Integer availablePlaces;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "association_id", nullable = false)
    private Association association;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ActionStatus status = ActionStatus.DRAFT;

    @Column(name = "is_fixed", nullable = false)
    @Builder.Default
    private Boolean isFixed = false;

    // ID de l'action fixe dans le service-admin
    @Column(name = "action_fixe_id")
    private Long actionFixeId;

    // programme de l'action ex: "09:00 — Accueil & café"
    @ElementCollection
    @CollectionTable(name = "action_program", joinColumns = @JoinColumn(name = "action_id"))
    @Column(name = "step")
    @OrderColumn(name = "step_order")
    @Builder.Default
    private List<String> program = new ArrayList<>();

    // informations pratiques ex: "Matériel fourni"
    @ElementCollection
    @CollectionTable(name = "action_infos", joinColumns = @JoinColumn(name = "action_id"))
    @Column(name = "info")
    @Builder.Default
    private List<String> practicalInfos = new ArrayList<>();

    @OneToMany(mappedBy = "action", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ActionPhoto> photos = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        // à la création places_disponibles = max_participants
        if (this.availablePlaces == null) {
            this.availablePlaces = this.maxParticipants;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // calculé — pas stocké en BD
    public Integer getRegisteredCount() {
        return this.maxParticipants - this.availablePlaces;
    }

    public enum ActionStatus {
        DRAFT, PUBLISHED, CANCELLED, COMPLETED
    }
}