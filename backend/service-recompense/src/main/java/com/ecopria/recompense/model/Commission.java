package com.ecopria.recompense.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Entity
@Table(name = "commissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    // valeur du coupon en Dirham
    @Column(name = "valeur_dh", nullable = false)
    private Double valeurDh;

    // commission calculée = valeur × taux
    @Column(name = "montant_commission", nullable = false)
    private Double montantCommission;

    // taux appliqué au moment du calcul ex: 15.0
    @Column(name = "taux_commission", nullable = false)
    private Double tauxCommission;

    // mois de facturation ex: 2026-05
    @Column(name = "mois_facturation", nullable = false, length = 7)
    private String moisFacturation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.moisFacturation == null) {
            YearMonth ym = YearMonth.now();
            this.moisFacturation = ym.getYear() + "-" +
                    String.format("%02d", ym.getMonthValue());
        }
    }
}