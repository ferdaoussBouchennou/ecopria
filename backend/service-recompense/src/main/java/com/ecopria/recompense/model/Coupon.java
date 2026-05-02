package com.ecopria.recompense.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // référence vers db_auth — sans FK
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recompense_id", nullable = false)
    private Recompense recompense;

    // code unique ex: ECO-2026-X7K9M
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "points_utilises", nullable = false)
    private Integer pointsUtilises;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CouponStatus status = CouponStatus.DISTRIBUE;

    // date d'expiration — 30 jours après génération
    @Column(name = "expire_le", nullable = false)
    private LocalDateTime expireLe;

    // date de validation en magasin
    @Column(name = "valide_le")
    private LocalDateTime valideLe;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.expireLe == null) {
            this.expireLe = LocalDateTime.now().plusDays(30);
        }
    }

    public enum CouponStatus {
        DISTRIBUE, // généré mais pas encore utilisé
        UTILISE, // validé en magasin
        EXPIRE // date dépassée
    }
}