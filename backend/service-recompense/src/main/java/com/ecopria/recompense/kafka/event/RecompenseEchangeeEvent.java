package com.ecopria.recompense.kafka.event;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecompenseEchangeeEvent {
    private Long userId;
    private Long recompenseId;
    private String codeCoupon;
    private Integer pointsUtilises;
    private Integer pointsRestants;
    private String recompenseTitle;
    private String partenaireName;
}