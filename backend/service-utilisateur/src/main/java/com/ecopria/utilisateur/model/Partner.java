package com.ecopria.utilisateur.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "partners")
public class Partner {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auth_id", unique = true, nullable = false)
    private Long authId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 150)
    private String email;

    @Column(length = 10)
    @jakarta.validation.constraints.Size(max = 10, message = "Le numéro de téléphone ne doit pas dépasser 10 chiffres")
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String city;

    @Column(length = 255)
    private String logo;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
