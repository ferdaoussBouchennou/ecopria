package com.ecopria.recompense.dto;

import lombok.*;

// Ce que le citoyen reçoit après avoir ouvert la boîte mystère
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultatMystereBoxDTO {
    private String titrePrix;       // ex: "-50% exceptionnel !"
    private String descriptionPrix; // ex: "50% de réduction sur tout le magasin"
    private Integer probabilite;    // la vraie chance qu'il avait de tomber dessus
    private CouponDTO coupon;       // le coupon généré (code à utiliser chez le partenaire)
}
