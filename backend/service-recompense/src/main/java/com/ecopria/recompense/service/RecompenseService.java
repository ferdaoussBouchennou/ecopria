package com.ecopria.recompense.service;

import com.ecopria.recompense.client.UtilisateurClient;
import com.ecopria.recompense.dto.*;
import com.ecopria.recompense.kafka.RecompenseProducer;
import com.ecopria.recompense.kafka.event.RecompenseEchangeeEvent;
import com.ecopria.recompense.model.*;
import com.ecopria.recompense.model.Recompense.RecompenseType;
import com.ecopria.recompense.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecompenseService {

    private final RecompenseRepository recompenseRepository;
    private final PartenaireRepository partenaireRepository;
    private final CouponRepository couponRepository;
    private final CommissionRepository commissionRepository;
    private final UtilisateurClient utilisateurClient;
    private final RecompenseProducer recompenseProducer;
    private final CodeCouponGenerator codeGenerator;

    // ─── CATALOGUE PUBLIC ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecompenseDTO> getCatalogue(RecompenseType type) {
        List<Recompense> recompenses;
        if (type != null) {
            recompenses = recompenseRepository
                    .findByIsActiveTrueAndType(type);
        } else {
            recompenses = recompenseRepository.findByIsActiveTrue();
        }
        return recompenses.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RecompenseDTO getDetail(Long id) {
        return toDTO(recompenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée")));
    }

    // ─── ÉCHANGER ────────────────────────────────────────────

    @Transactional
    public CouponDTO echanger(Long recompenseId, Long userId) {
        Recompense recompense = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));

        // vérifier que la récompense est disponible
        if (!recompense.isAvailable()) {
            throw new RuntimeException("Cette récompense n'est plus disponible");
        }

        // vérifier le solde de points via service-utilisateur
        Integer solde = utilisateurClient.getPoints(userId);
        if (solde < recompense.getPointsNecessaires()) {
            throw new RuntimeException(
                    "Points insuffisants. Solde : " + solde +
                            " — Requis : " + recompense.getPointsNecessaires());
        }

        // décrémenter le stock si type STOCK ou EXPERIENCE
        if (recompense.getType() == RecompenseType.STOCK ||
                recompense.getType() == RecompenseType.EXPERIENCE) {
            if (recompense.getStock() != null) {
                recompense.setStock(recompense.getStock() - 1);
                recompenseRepository.save(recompense);
            }
        }

        // générer le code coupon unique
        String code = codeGenerator.generate();

        // créer le coupon — expire dans 30 jours si non utilisé
        // (la vraie "expiration" = le scan du partenaire qui le passe en UTILISE)
        Coupon coupon = Coupon.builder()
                .userId(userId)
                .recompense(recompense)
                .code(code)
                .pointsUtilises(recompense.getPointsNecessaires())
                .status(Coupon.CouponStatus.DISTRIBUE)
                .expireLe(java.time.LocalDateTime.now().plusDays(30))
                .build();

        Coupon saved = couponRepository.save(coupon);

        // publier sur Kafka → service-utilisateur déduit les points
        // → service-notification envoie le coupon par email
        recompenseProducer.publishRecompenseEchangee(
                RecompenseEchangeeEvent.builder()
                        .userId(userId)
                        .recompenseId(recompenseId)
                        .codeCoupon(code)
                        .pointsUtilises(recompense.getPointsNecessaires())
                        .pointsRestants(solde - recompense.getPointsNecessaires())
                        .recompenseTitle(recompense.getTitle())
                        .partenaireName(recompense.getPartenaire().getName())
                        .build());

        log.info("Coupon {} généré pour userId: {}", code, userId);
        return toCouponDTO(saved);
    }

    // ─── MES COUPONS — espace utilisateur ────────────────────

    @Transactional(readOnly = true)
    public List<CouponDTO> getMesCoupons(Long userId) {
        return couponRepository.findByUserId(userId)
                .stream()
                .map(this::toCouponDTO)
                .collect(Collectors.toList());
    }

    // ─── DASHBOARD PARTENAIRE ────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardPartenaireDTO getDashboard(Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);

        Long distribues = couponRepository
                .countByRecompensePartenaireId(partenaire.getId());
        Long utilises = couponRepository
                .countByRecompensePartenaireIdAndStatus(
                        partenaire.getId(), Coupon.CouponStatus.UTILISE);

        double taux = distribues > 0 ? (double) utilises / distribues * 100 : 0;

        // commissions du mois en cours
        String moisActuel = getCurrentMois();
        Double commissions = commissionRepository
                .sumCommissionsByPartenaireAndMois(partenaire.getId(), moisActuel);

        // offres actives
        List<RecompenseDTO> offres = recompenseRepository
                .findByPartenaireIdAndIsActiveTrue(partenaire.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());

        // échanges récents
        List<CouponDTO> recents = couponRepository
                .findValidatedTodayByPartenaire(partenaire.getId())
                .stream().map(this::toCouponDTO).collect(Collectors.toList());

        return DashboardPartenaireDTO.builder()
                .partenaireName(partenaire.getName())
                .couponsDistribues(distribues)
                .couponsUtilises(utilises)
                .tauxUtilisation(Math.round(taux * 100.0) / 100.0)
                .commissionsARegler(commissions != null ? commissions : 0.0)
                .offresActives(offres)
                .echangesRecents(recents)
                .build();
    }

    // ─── MES OFFRES PARTENAIRE ────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecompenseDTO> getMesOffres(Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);
        return recompenseRepository.findByPartenaireId(partenaire.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public RecompenseDTO creerOffre(CreateRecompenseDTO dto, Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);

        // Validation commune : si on met une réduction %, il faut obligatoirement la valeur en DH pour la commission
        if (dto.getDiscountPercentage() != null && dto.getValeurDh() == null) {
            throw new RuntimeException("La valeurDh est obligatoire si vous spécifiez un pourcentage de réduction");
        }

        // validation métier selon le type
        switch (dto.getType()) {
            case STOCK -> {
                if (dto.getStock() == null || dto.getStock() < 1)
                    throw new RuntimeException("Le stock est obligatoire et doit être > 0 pour type STOCK");
            }
            case REDUCTION -> {
                if (dto.getDiscountPercentage() == null)
                    throw new RuntimeException("Le pourcentage de réduction est obligatoire pour type REDUCTION");
                if (dto.getValeurDh() == null)
                    throw new RuntimeException("La valeurDh (valeur moyenne de la remise) est obligatoire pour type REDUCTION");
            }
            case SERVICE, EXPERIENCE -> {
                // valeurDh et discountPercentage sont optionnels ici, 
                // mais si discountPercentage est mis, valeurDh est forcée par la validation commune au-dessus
            }
        }

        Recompense recompense = Recompense.builder()
                .partenaire(partenaire)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .pointsNecessaires(dto.getPointsNecessaires())
                .type(dto.getType())
                .stock(dto.getStock())
                .discountPercentage(dto.getDiscountPercentage())
                .valeurDh(dto.getValeurDh())
                .dateExpiration(dto.getDateExpiration())
                .isActive(true)
                .build();

        return toDTO(recompenseRepository.save(recompense));
    }

    @Transactional
    public RecompenseDTO modifierOffre(Long recompenseId,
            CreateRecompenseDTO dto,
            Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);
        Recompense recompense = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));

        if (!recompense.getPartenaire().getId().equals(partenaire.getId())) {
            throw new RuntimeException("Vous n'êtes pas le propriétaire de cette offre");
        }

        if (dto.getTitle() != null)
            recompense.setTitle(dto.getTitle());
        if (dto.getDescription() != null)
            recompense.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null)
            recompense.setImageUrl(dto.getImageUrl());
        if (dto.getPointsNecessaires() != null)
            recompense.setPointsNecessaires(dto.getPointsNecessaires());
        if (dto.getStock() != null)
            recompense.setStock(dto.getStock());
        if (dto.getDiscountPercentage() != null)
            recompense.setDiscountPercentage(dto.getDiscountPercentage());
        if (dto.getValeurDh() != null)
            recompense.setValeurDh(dto.getValeurDh());
        if (dto.getDateExpiration() != null)
            recompense.setDateExpiration(dto.getDateExpiration());

        return toDTO(recompenseRepository.save(recompense));
    }

    @Transactional
    public void desactiverOffre(Long recompenseId, Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);
        Recompense recompense = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));

        if (!recompense.getPartenaire().getId().equals(partenaire.getId())) {
            throw new RuntimeException("Vous n'êtes pas le propriétaire de cette offre");
        }

        recompense.setIsActive(false);
        recompenseRepository.save(recompense);
    }

    // ─── VALIDER COUPON — scan partenaire ────────────────────

    @Transactional
    public CouponDTO validerCoupon(String code, Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);

        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Coupon introuvable : " + code));

        // vérifier que le coupon appartient à ce partenaire
        if (!coupon.getRecompense().getPartenaire().getId()
                .equals(partenaire.getId())) {
            throw new RuntimeException("Ce coupon n'appartient pas à votre enseigne");
        }

        // vérifier que le coupon n'est pas déjà utilisé
        if (coupon.getStatus() == Coupon.CouponStatus.UTILISE) {
            throw new RuntimeException("Ce coupon a déjà été utilisé");
        }

        // vérifier que le coupon n'est pas expiré
        if (coupon.getExpireLe().isBefore(java.time.LocalDateTime.now())) {
            coupon.setStatus(Coupon.CouponStatus.EXPIRE);
            couponRepository.save(coupon);
            throw new RuntimeException("Ce coupon est expiré");
        }

        // valider le coupon
        coupon.setStatus(Coupon.CouponStatus.UTILISE);
        coupon.setValideLe(java.time.LocalDateTime.now());
        couponRepository.save(coupon);

        // calculer et enregistrer la commission
        // Calcul de la commission selon la logique métier unifiée :
        // - Si l'offre a un pourcentage de réduction (% > 0) ET une valeurDh -> on commissionne la remise.
        // - Si c'est 100% gratuit (pas de %) -> pas de commission.

        Double baseCommission = null;
        Recompense r = coupon.getRecompense();

        if (r.getDiscountPercentage() != null && r.getValeurDh() != null) {
            // ex: T-shirt 150 DH à -50% -> base = 150 * 50% = 75 DH
            // ex: Type REDUCTION 15% (valeurDh=50) -> base = 50 * 15% / 15% (déjà inclus) -> 
            // Attention: pour le type REDUCTION pur, valeurDh est déjà la valeur de la remise.
            
            if (r.getType() == com.ecopria.recompense.model.Recompense.RecompenseType.REDUCTION) {
                baseCommission = r.getValeurDh();
            } else {
                baseCommission = r.getValeurDh() * r.getDiscountPercentage() / 100.0;
            }
        }

        if (baseCommission != null) {
            double montant = baseCommission * partenaire.getCommissionRate() / 100;

            Commission commission = Commission.builder()
                    .partenaire(partenaire)
                    .coupon(coupon)
                    .valeurDh(baseCommission)
                    .montantCommission(montant)
                    .tauxCommission(partenaire.getCommissionRate())
                    .build();

            commissionRepository.save(commission);
            log.info("Commission {} DH calculée pour coupon {} (base={} DH)", montant, code, baseCommission);
        } else {
            log.info("Aucune commission calculée pour coupon {} (offre gratuite sans remise monétaire)", code);
        }

        log.info("Coupon {} validé par partenaire {}", code, partenaire.getName());
        return toCouponDTO(coupon);
    }

    // ─── COMMISSIONS PARTENAIRE ───────────────────────────────

    @Transactional(readOnly = true)
    public List<CommissionMensuelleDTO> getCommissions(Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);

        return commissionRepository
                .findMonthlyHistoryByPartenaire(partenaire.getId())
                .stream()
                .map(row -> CommissionMensuelleDTO.builder()
                        .mois((String) row[0])
                        .couponsUtilises((Long) row[1])
                        .caGenere((Double) row[2])
                        .commission((Double) row[3])
                        .build())
                .collect(Collectors.toList());
    }

    // ─── MÉTHODES PRIVÉES ─────────────────────────────────────

    private Partenaire getPartenaireByUserId(Long userId) {
        return partenaireRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Partenaire non trouvé pour userId: " + userId));
    }

    private String getCurrentMois() {
        java.time.YearMonth ym = java.time.YearMonth.now();
        return ym.getYear() + "-" +
                String.format("%02d", ym.getMonthValue());
    }

    private RecompenseDTO toDTO(Recompense r) {
        return RecompenseDTO.builder()
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
                .isAvailable(r.isAvailable())
                .isActive(r.getIsActive())
                .build();
    }

    private CouponDTO toCouponDTO(Coupon c) {
        return CouponDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .recompenseTitle(c.getRecompense().getTitle())
                .recompenseImageUrl(c.getRecompense().getImageUrl())
                .partenaireName(c.getRecompense().getPartenaire().getName())
                .pointsUtilises(c.getPointsUtilises())
                .status(c.getStatus())
                .expireLe(c.getExpireLe())
                .valideLe(c.getValideLe())
                .createdAt(c.getCreatedAt())
                .build();
    }
}