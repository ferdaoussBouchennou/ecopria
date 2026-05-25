package com.ecopria.recompense.repository;

import com.ecopria.recompense.model.Coupon;
import com.ecopria.recompense.model.Coupon.CouponStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    // mes coupons — espace utilisateur
    List<Coupon> findByUserId(Long userId);

    // mes coupons par statut
    List<Coupon> findByUserIdAndStatus(Long userId, CouponStatus status);

    // chercher un coupon par son code — pour validation partenaire
    Optional<Coupon> findByCode(String code);

    // coupons d'une récompense
    List<Coupon> findByRecompenseId(Long recompenseId);

    // coupons validés aujourd'hui par un partenaire
    @Query("SELECT c FROM Coupon c " +
           "WHERE c.recompense.partenaire.id = :partenaireId " +
           "AND c.status = 'UTILISE' " +
           "AND DATE(c.valideLe) = CURRENT_DATE " +
           "ORDER BY c.valideLe DESC")
    List<Coupon> findValidatedTodayByPartenaire(
        @Param("partenaireId") Long partenaireId);

    // compter les coupons distribués d'un partenaire
    Long countByRecompensePartenaireId(Long partenaireId);

    // compter les coupons utilisés d'un partenaire
    Long countByRecompensePartenaireIdAndStatus(
        Long partenaireId, CouponStatus status);

    // vérifier si un utilisateur a déjà échangé cette récompense
    boolean existsByUserIdAndRecompenseId(Long userId, Long recompenseId);

    Long countByRecompenseId(Long recompenseId);

    Long countByRecompenseIdAndStatus(Long recompenseId, CouponStatus status);

    @Query("SELECT c FROM Coupon c WHERE c.recompense.partenaire.id = :partenaireId " +
           "ORDER BY c.createdAt DESC")
    List<Coupon> findRecentByPartenaire(@Param("partenaireId") Long partenaireId,
                                        org.springframework.data.domain.Pageable pageable);
}