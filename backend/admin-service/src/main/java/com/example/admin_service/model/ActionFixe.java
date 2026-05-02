package com.example.admin_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "actions_fixes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionFixe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String titre;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 120)
    private String categorie;

    @Column(length = 255)
    private String lieu;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Integer points;

    @Column(name = "places_total")
    private Integer placesTotal;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
