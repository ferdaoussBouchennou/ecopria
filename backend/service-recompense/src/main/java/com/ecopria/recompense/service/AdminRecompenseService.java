package com.ecopria.recompense.service;

import com.ecopria.recompense.dto.admin.*;
import com.ecopria.recompense.model.AvisPartenaire;
import com.ecopria.recompense.model.Commission;
import com.ecopria.recompense.model.Coupon;
import com.ecopria.recompense.model.Recompense;
import com.ecopria.recompense.repository.AvisPartenaireRepository;
import com.ecopria.recompense.repository.CommissionRepository;
import com.ecopria.recompense.repository.CouponRepository;
import com.ecopria.recompense.repository.RecompenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminRecompenseService {

    private final RecompenseRepository recompenseRepository;
    private final CommissionRepository commissionRepository;
    private final AvisPartenaireRepository avisPartenaireRepository;
    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public List<AdminOffreDTO> listOffres() {
        return recompenseRepository.findAllWithPartenaireOrderByCreatedAtDesc()
                .stream()
                .map(this::toAdminOffreDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminOffreDTO activateOffre(Long id) {
        Recompense recompense = recompenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        recompense.setIsActive(true);
        return toAdminOffreDTO(recompenseRepository.save(recompense));
    }

    @Transactional
    public AdminOffreDTO suspendOffre(Long id) {
        Recompense recompense = recompenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        recompense.setIsActive(false);
        return toAdminOffreDTO(recompenseRepository.save(recompense));
    }

    @Transactional(readOnly = true)
    public List<AdminCommissionDTO> listCommissions() {
        return commissionRepository.findAllWithDetailsOrderByCreatedAtDesc()
                .stream()
                .map(this::toAdminCommissionDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminCommissionSummaryDTO commissionSummary() {
        Double total = commissionRepository.sumAllCommissions();
        String currentMois = currentMois();
        Double currentMonth = commissionRepository.sumCommissionsByMois(currentMois);
        Long totalCoupons = commissionRepository.countAll();

        List<AdminCommissionMoisDTO> monthly = commissionRepository.findGlobalMonthlyHistory()
                .stream()
                .map(row -> AdminCommissionMoisDTO.builder()
                        .mois((String) row[0])
                        .couponsUtilises((Long) row[1])
                        .caGenere(row[2] != null ? (Double) row[2] : 0.0)
                        .commission(row[3] != null ? (Double) row[3] : 0.0)
                        .build())
                .collect(Collectors.toList());

        return AdminCommissionSummaryDTO.builder()
                .totalCommission(total != null ? total : 0.0)
                .currentMonthCommission(currentMonth != null ? currentMonth : 0.0)
                .totalCoupons(totalCoupons != null ? totalCoupons : 0L)
                .monthlyHistory(monthly)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminAvisDTO> listAvis() {
        return avisPartenaireRepository.findAllWithPartenaireOrderByCreatedAtDesc()
                .stream()
                .map(this::toAdminAvisDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminAvisDTO hideAvis(Long id) {
        AvisPartenaire avis = findAvis(id);
        avis.setVisible(false);
        return toAdminAvisDTO(avisPartenaireRepository.save(avis));
    }

    @Transactional
    public AdminAvisDTO showAvis(Long id) {
        AvisPartenaire avis = findAvis(id);
        avis.setVisible(true);
        return toAdminAvisDTO(avisPartenaireRepository.save(avis));
    }

    @Transactional
    public void deleteAvis(Long id) {
        AvisPartenaire avis = findAvis(id);
        avisPartenaireRepository.delete(avis);
    }

    private AvisPartenaire findAvis(Long id) {
        return avisPartenaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Avis non trouvé"));
    }

    private AdminOffreDTO toAdminOffreDTO(Recompense r) {
        return AdminOffreDTO.builder()
                .id(r.getId())
                .partenaireId(r.getPartenaire().getId())
                .partenaireName(r.getPartenaire().getName())
                .partenaireCategory(r.getPartenaire().getCategory())
                .title(r.getTitle())
                .description(r.getDescription())
                .imageUrl(r.getImageUrl())
                .pointsNecessaires(r.getPointsNecessaires())
                .type(r.getType())
                .stock(r.getStock())
                .discountPercentage(r.getDiscountPercentage())
                .valeurDh(r.getValeurDh())
                .dateExpiration(r.getDateExpiration())
                .isActive(r.getIsActive())
                .isAvailable(r.isAvailable())
                .couponsDistribues(couponRepository.countByRecompenseId(r.getId()))
                .couponsUtilises(couponRepository.countByRecompenseIdAndStatus(
                        r.getId(), Coupon.CouponStatus.UTILISE))
                .createdAt(r.getCreatedAt())
                .build();
    }

    private AdminCommissionDTO toAdminCommissionDTO(Commission c) {
        return AdminCommissionDTO.builder()
                .id(c.getId())
                .partenaireId(c.getPartenaire().getId())
                .partenaireName(c.getPartenaire().getName())
                .couponCode(c.getCoupon().getCode())
                .offreTitle(c.getCoupon().getRecompense().getTitle())
                .valeurDh(c.getValeurDh())
                .montantCommission(c.getMontantCommission())
                .tauxCommission(c.getTauxCommission())
                .moisFacturation(c.getMoisFacturation())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private AdminAvisDTO toAdminAvisDTO(AvisPartenaire a) {
        return AdminAvisDTO.builder()
                .id(a.getId())
                .partenaireId(a.getPartenaire().getId())
                .partenaireName(a.getPartenaire().getName())
                .authorName(a.getAuthorName())
                .rating(a.getRating())
                .comment(a.getComment())
                .reponse(a.getReponse())
                .visible(a.getVisible())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private String currentMois() {
        YearMonth ym = YearMonth.now();
        return ym.getYear() + "-" + String.format("%02d", ym.getMonthValue());
    }
}
