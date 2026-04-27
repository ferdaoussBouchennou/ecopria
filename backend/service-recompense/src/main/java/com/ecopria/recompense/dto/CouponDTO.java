package com.ecopria.recompense.dto;

import com.ecopria.recompense.model.Coupon.CouponStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponDTO {
    private Long id;
    private String code;
    private String recompenseTitle;
    private String recompenseImageUrl;
    private String partenaireName;
    private Integer pointsUtilises;
    private CouponStatus status;
    private LocalDateTime expireLe;
    private LocalDateTime valideLe;
    private LocalDateTime createdAt;
}