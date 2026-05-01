package com.ecopria.recompense.kafka.event;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponUtiliseEvent {
    private Long userId;
    private String codeCoupon;
    private String recompenseTitle;
    private String partenaireName;
    private LocalDateTime valideLe;
}
