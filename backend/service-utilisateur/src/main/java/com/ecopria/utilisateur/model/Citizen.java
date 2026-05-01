package com.ecopria.utilisateur.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "citizens")
public class Citizen {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auth_id", unique = true, nullable = false)
    private Long authId;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(unique = true, length = 150)
    private String email;

    @Column(length = 255)
    private String photo;

    @Column(length = 10)
    @jakarta.validation.constraints.Size(max = 10, message = "Le numéro de téléphone ne doit pas dépasser 10 chiffres")
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;           // ← affiché dans le classement

    @Column(name = "total_points")
    private Integer totalPoints = 0;

    @Transient
    public Integer getLevel() {
        if (totalPoints == null) return 1;
        return 1 + (totalPoints / 500);
    }

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}