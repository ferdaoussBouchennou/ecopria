package com.ecopria.recompense.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValiderCouponDTO {

    @NotBlank(message = "Le code coupon est obligatoire")
    private String code;
}