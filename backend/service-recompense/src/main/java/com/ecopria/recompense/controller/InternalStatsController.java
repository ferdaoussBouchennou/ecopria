package com.ecopria.recompense.controller;

import com.ecopria.recompense.dto.InternalStatsResponse;
import com.ecopria.recompense.model.Coupon.CouponStatus;
import com.ecopria.recompense.repository.CommissionRepository;
import com.ecopria.recompense.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/stats")
@RequiredArgsConstructor
public class InternalStatsController {

    private final CouponRepository couponRepository;
    private final CommissionRepository commissionRepository;

    @GetMapping
    public ResponseEntity<InternalStatsResponse> getStats() {
        long exchanged = couponRepository.countByStatus(CouponStatus.UTILISE);
        Double revenue = commissionRepository.sumAllCommissions();
        return ResponseEntity.ok(InternalStatsResponse.builder()
                .totalRewardsExchanged(exchanged)
                .commissionRevenue(revenue != null ? revenue : 0.0)
                .build());
    }
}
