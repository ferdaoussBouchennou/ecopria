package com.ecopria.recompense.service;

import com.ecopria.recompense.client.UtilisateurClient;
import com.ecopria.recompense.dto.*;
import com.ecopria.recompense.kafka.RecompenseProducer;
import com.ecopria.recompense.kafka.event.CouponUtiliseEvent;
import com.ecopria.recompense.kafka.event.RecompenseEchangeeEvent;
import com.ecopria.recompense.kafka.event.RecompenseEpuiseeEvent;
import com.ecopria.recompense.model.*;
import com.ecopria.recompense.model.Recompense.RecompenseType;
import com.ecopria.recompense.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecompenseService {

    private final RecompenseRepository recompenseRepository;
    private final PartenaireRepository partenaireRepository;
    private final CouponRepository couponRepository;
    private final CommissionRepository commissionRepository;
    private final MystereBoxItemRepository mystereBoxItemRepository;
    private final AvisPartenaireRepository avisPartenaireRepository;
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
                .map(this::toPublicDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RecompenseDTO getDetail(Long id) {
        return toPublicDTO(recompenseRepository.findById(id)
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

                if (recompense.getStock() == 0) {
                    recompenseProducer.publishRecompenseEpuisee(
                            RecompenseEpuiseeEvent.builder()
                                    .partenaireUserId(recompense.getPartenaire().getUserId())
                                    .recompenseId(recompense.getId())
                                    .recompenseTitle(recompense.getTitle())
                                    .partenaireName(recompense.getPartenaire().getName())
                                    .build());
                }
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

        // ✅ DÉDUCTION IMMÉDIATE DES POINTS (sans Kafka)
        String raisonDeduction = "Échange récompense: " + recompense.getTitle();
        utilisateurClient.deduirePoints(userId, recompense.getPointsNecessaires(), raisonDeduction);

        // publier sur Kafka → service-notification envoie le coupon par email
        // (la déduction est déjà faite ci-dessus, ce event sert juste pour les notifications)
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

        log.info("Coupon {} généré pour userId: {} - Points déduits: {}", code, userId, recompense.getPointsNecessaires());
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

    /** Renvoie l'e-mail du coupon (Kafka → service-notification). */
    @Transactional(readOnly = true)
    public void renvoyerCouponParEmail(Long couponId, Long userId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("Coupon introuvable : " + couponId));
        if (!coupon.getUserId().equals(userId)) {
            throw new RuntimeException("Ce coupon ne vous appartient pas");
        }
        if (coupon.getStatus() == Coupon.CouponStatus.EXPIRE
                || coupon.getExpireLe().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Ce coupon est expiré");
        }

        Recompense recompense = coupon.getRecompense();
        Integer solde = utilisateurClient.getPoints(userId);
        recompenseProducer.publishRecompenseEchangee(
                RecompenseEchangeeEvent.builder()
                        .userId(userId)
                        .recompenseId(recompense.getId())
                        .codeCoupon(coupon.getCode())
                        .pointsUtilises(coupon.getPointsUtilises())
                        .pointsRestants(solde)
                        .recompenseTitle(recompense.getTitle())
                        .partenaireName(recompense.getPartenaire().getName())
                        .build());
        log.info("Renvoi e-mail coupon {} pour userId {}", coupon.getCode(), userId);
    }

    // ─── DASHBOARD PARTENAIRE ────────────────────────────────

    @Transactional
    public DashboardPartenaireDTO getDashboard(Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);
        long vuesProfil = nullableLong(partenaire.getVuesProfil());
        long clicsOffres = nullableLong(partenaire.getClicsOffres());

        long distribuesCount = nullableLong(
                couponRepository.countByRecompensePartenaireId(partenaire.getId()));
        long utilisesCount = nullableLong(couponRepository
                .countByRecompensePartenaireIdAndStatus(
                        partenaire.getId(), Coupon.CouponStatus.UTILISE));

        double taux = distribuesCount > 0 ? (double) utilisesCount / distribuesCount * 100 : 0;

        // commissions du mois en cours
        String moisActuel = getCurrentMois();
        Double commissions = commissionRepository
                .sumCommissionsByPartenaireAndMois(partenaire.getId(), moisActuel);

        // offres actives
        List<RecompenseDTO> offres = recompenseRepository
                .findByPartenaireIdAndIsActiveTrue(partenaire.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());

        List<CouponDTO> recents = couponRepository
                .findRecentByPartenaire(partenaire.getId(), PageRequest.of(0, 8))
                .stream().map(this::toCouponDTO).collect(Collectors.toList());

        Double noteMoyenne = avisPartenaireRepository.averageRatingByPartenaire(partenaire.getId());
        Long nombreAvis = avisPartenaireRepository.countByPartenaireId(partenaire.getId());

        return DashboardPartenaireDTO.builder()
                .partenaireName(partenaire.getName())
                .vuesProfil(vuesProfil)
                .clicsOffres(clicsOffres)
                .tauxClic(tauxClicPercent(vuesProfil, clicsOffres))
                .couponsDistribues(distribuesCount)
                .couponsUtilises(utilisesCount)
                .tauxUtilisation(Math.round(taux * 100.0) / 100.0)
                .noteMoyenne(noteMoyenne != null ? Math.round(noteMoyenne * 10.0) / 10.0 : null)
                .nombreAvis(nombreAvis != null ? nombreAvis : 0L)
                .commissionsARegler(commissions != null ? commissions : 0.0)
                .commissionRate(partenaire.getCommissionRate() != null
                        ? partenaire.getCommissionRate() : 10.0)
                .badgeActuel(computeBadgeActuel(utilisesCount))
                .offresActives(offres)
                .echangesRecents(recents)
                .build();
    }

    // ─── PROFIL PUBLIC PARTENAIRE ────────────────────────────

    @Transactional
    public PartenaireProfilDTO getProfil(Long userId) {
        return toProfilDTO(resolvePartenaireAccount(userId));
    }

    @Transactional
    public PartenaireProfilDTO updateProfil(Long userId, UpdatePartenaireProfilDTO dto) {
        Partenaire p = resolvePartenaireAccount(userId);
        if (dto.getName() != null) p.setName(dto.getName());
        if (dto.getCategory() != null) p.setCategory(dto.getCategory());
        if (dto.getAddress() != null) p.setAddress(dto.getAddress());
        if (dto.getCity() != null) p.setCity(dto.getCity());
        if (dto.getDescription() != null) p.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null) p.setImageUrl(dto.getImageUrl());
        if (dto.getGalleryImages() != null) p.setGalleryImages(joinGallery(dto.getGalleryImages()));
        if (dto.getPhone() != null) p.setPhone(dto.getPhone());
        if (dto.getWebsite() != null) p.setWebsite(dto.getWebsite());
        if (dto.getInstagramUrl() != null) p.setInstagramUrl(dto.getInstagramUrl());
        if (dto.getFacebookUrl() != null) p.setFacebookUrl(dto.getFacebookUrl());
        if (dto.getOpeningHours() != null) p.setOpeningHours(dto.getOpeningHours());
        return toProfilDTO(partenaireRepository.save(p));
    }

    @Transactional
    public PartenaireProfilDTO getProfilPublic(Long partenaireUserId) {
        Partenaire p = requirePartenaire(partenaireUserId);
        p.setVuesProfil(nullableLong(p.getVuesProfil()) + 1);
        partenaireRepository.save(p);
        return toProfilDTO(p);
    }

    @Transactional(readOnly = true)
    public List<PartenaireProfilDTO> getPartenairesPublics() {
        return partenaireRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(Partenaire::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toProfilDTO)
                .collect(Collectors.toList());
    }

    // ─── OFFRES D'UN PARTENAIRE ─────────────────────────────

    @Transactional
    public List<RecompenseDTO> getOffresPartenaire(Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);
        
        // Récupérer uniquement les offres actives de ce partenaire
        List<Recompense> recompenses = recompenseRepository
                .findByPartenaireIdAndIsActiveTrue(partenaire.getId());
        
        return recompenses.stream()
                .map(this::toPublicDTO)
                .collect(Collectors.toList());
    }

    // ─── VISIBILITÉ & AVIS ───────────────────────────────────

    @Transactional
    public VisibiliteDTO getVisibilite(Long userId) {
        Partenaire p = resolvePartenaireAccount(userId);
        long vuesProfil = nullableLong(p.getVuesProfil());
        long clicsOffres = nullableLong(p.getClicsOffres());
        long distribuesCount = nullableLong(couponRepository.countByRecompensePartenaireId(p.getId()));
        long utilisesCount = nullableLong(couponRepository.countByRecompensePartenaireIdAndStatus(
                p.getId(), Coupon.CouponStatus.UTILISE));
        double tauxConv = distribuesCount > 0 ? (double) utilisesCount / distribuesCount * 100 : 0;
        Double note = avisPartenaireRepository.averageRatingByPartenaire(p.getId());
        Long nbAvis = avisPartenaireRepository.countByPartenaireId(p.getId());

        return VisibiliteDTO.builder()
                .vuesProfil(vuesProfil)
                .clicsOffres(clicsOffres)
                .tauxClic(tauxClicPercent(vuesProfil, clicsOffres))
                .noteMoyenne(note != null ? Math.round(note * 10.0) / 10.0 : null)
                .nombreAvis(nbAvis)
                .couponsDistribues(distribuesCount)
                .couponsUtilises(utilisesCount)
                .tauxConversion(Math.round(tauxConv * 100.0) / 100.0)
                .badgeActuel(computeBadgeActuel(utilisesCount))
                .progressionBadges(buildBadgeProgression(utilisesCount))
                .build();
    }

    @Transactional
    public List<AvisDTO> getAvis(Long userId) {
        Partenaire p = resolvePartenaireAccount(userId);
        return avisPartenaireRepository.findByPartenaireIdOrderByCreatedAtDesc(p.getId())
                .stream().map(this::toAvisDTO).collect(Collectors.toList());
    }

    @Transactional
    public AvisDTO repondreAvis(Long userId, Long avisId, RepondreAvisDTO dto) {
        Partenaire p = resolvePartenaireAccount(userId);
        AvisPartenaire avis = avisPartenaireRepository.findById(avisId)
                .orElseThrow(() -> new RuntimeException("Avis non trouvé"));
        if (!avis.getPartenaire().getId().equals(p.getId())) {
            throw new RuntimeException("Cet avis ne vous appartient pas");
        }
        avis.setReponse(dto.getReponse());
        return toAvisDTO(avisPartenaireRepository.save(avis));
    }

    @Transactional
    public void enregistrerClicOffre(Long recompenseId) {
        Recompense r = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));
        Partenaire p = r.getPartenaire();
        p.setClicsOffres(nullableLong(p.getClicsOffres()) + 1);
        partenaireRepository.save(p);
    }

    @Transactional
    public RecompenseDTO toggleOffreActive(Long recompenseId, Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);
        Recompense recompense = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));
        if (!recompense.getPartenaire().getId().equals(partenaire.getId())) {
            throw new RuntimeException("Vous n'êtes pas le propriétaire de cette offre");
        }
        recompense.setIsActive(!Boolean.TRUE.equals(recompense.getIsActive()));
        return toDTO(recompenseRepository.save(recompense));
    }

    // ─── MES OFFRES PARTENAIRE ────────────────────────────────

    @Transactional
    public List<RecompenseDTO> getMesOffres(Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);
        return recompenseRepository.findByPartenaireId(partenaire.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public RecompenseDTO creerOffre(CreateRecompenseDTO dto, Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);

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

        // Gestion de la boîte mystère
        if (Boolean.TRUE.equals(dto.getHasMystereBox())) {
            if (dto.getMystereBoxPoints() == null)
                throw new RuntimeException("Le coût en points de la boîte mystère est obligatoire");
            if (dto.getMystereBoxItems() == null || dto.getMystereBoxItems().size() < 2)
                throw new RuntimeException("La boîte mystère doit contenir au moins 2 options");
            int totalProba = dto.getMystereBoxItems().stream().mapToInt(MystereBoxItemDTO::getProbabilite).sum();
            if (totalProba != 100)
                throw new RuntimeException("La somme des probabilités doit égaler 100 (actuel: " + totalProba + ")");

            recompense.setHasMystereBox(true);
            recompense.setMystereBoxPoints(dto.getMystereBoxPoints());

            List<MystereBoxItem> items = dto.getMystereBoxItems().stream()
                    .map(i -> MystereBoxItem.builder()
                            .recompense(recompense)
                            .titre(i.getTitre())
                            .description(i.getDescription())
                            .probabilite(i.getProbabilite())
                            .build())
                    .collect(Collectors.toList());
            recompense.getMystereBoxItems().addAll(items);
        }

        return toDTO(recompenseRepository.save(recompense));
    }

    @Transactional
    public RecompenseDTO modifierOffre(Long recompenseId,
            CreateRecompenseDTO dto,
            Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);
        Recompense recompense = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));

        if (!recompense.getPartenaire().getId().equals(partenaire.getId())) {
            throw new RuntimeException("Vous n'êtes pas le propriétaire de cette offre");
        }

        // Mettre à jour tous les champs envoyés
        if (dto.getTitle() != null)
            recompense.setTitle(dto.getTitle());
        if (dto.getDescription() != null)
            recompense.setDescription(dto.getDescription());
        // imageUrl peut être vidée intentionnellement — on accepte la valeur même vide
        recompense.setImageUrl(dto.getImageUrl());
        if (dto.getPointsNecessaires() != null)
            recompense.setPointsNecessaires(dto.getPointsNecessaires());
        // Mettre à jour le type (manquait avant)
        if (dto.getType() != null)
            recompense.setType(dto.getType());
        // Stock : toujours mettre à jour (peut être null pour REDUCTION/SERVICE)
        recompense.setStock(dto.getStock());
        // discountPercentage : toujours mettre à jour
        recompense.setDiscountPercentage(dto.getDiscountPercentage());
        // valeurDh : toujours mettre à jour
        recompense.setValeurDh(dto.getValeurDh());
        // dateExpiration : toujours mettre à jour (peut être null)
        recompense.setDateExpiration(dto.getDateExpiration());

        return toDTO(recompenseRepository.save(recompense));
    }

    @Transactional
    public void desactiverOffre(Long recompenseId, Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);
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
        Partenaire partenaire = resolvePartenaireAccount(userId);

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

        // publier l'événement d'utilisation
        recompenseProducer.publishCouponUtilise(
                CouponUtiliseEvent.builder()
                        .userId(coupon.getUserId())
                        .codeCoupon(coupon.getCode())
                        .recompenseTitle(coupon.getRecompense().getTitle())
                        .partenaireName(partenaire.getName())
                        .valideLe(coupon.getValideLe())
                        .build());

        // calculer et enregistrer la commission
        // Calcul de la commission selon la logique métier :
        // - Pour type REDUCTION : base = valeurDh
        // - Pour autres types avec % et valeurDh : base = valeurDh × % / 100
        // - Pour autres types avec seulement valeurDh : base = valeurDh
        // Commission = base × taux_partenaire / 100

        Double baseCommission = null;
        Recompense r = coupon.getRecompense();

        // Déterminer la base de commission selon le type d'offre
        if (r.getType() == com.ecopria.recompense.model.Recompense.RecompenseType.REDUCTION) {
            // Type REDUCTION : valeurDh représente déjà la valeur de la réduction
            if (r.getValeurDh() != null && r.getValeurDh() > 0) {
                baseCommission = r.getValeurDh();
            }
        } else if (r.getDiscountPercentage() != null && r.getValeurDh() != null) {
            // Offre avec pourcentage de réduction (ex: T-shirt 150 DH à -50%)
            baseCommission = r.getValeurDh() * r.getDiscountPercentage() / 100.0;
        } else if (r.getValeurDh() != null && r.getValeurDh() > 0) {
            // Offre avec seulement valeurDh (considérée comme 100% gratuite)
            baseCommission = r.getValeurDh();
        }

        if (baseCommission != null && baseCommission > 0) {
            double montant = baseCommission * partenaire.getCommissionRate() / 100;

            Commission commission = Commission.builder()
                    .partenaire(partenaire)
                    .coupon(coupon)
                    .valeurDh(baseCommission)
                    .montantCommission(montant)
                    .tauxCommission(partenaire.getCommissionRate())
                    .build();

            commissionRepository.save(commission);
            log.info("Commission {} DH calculée pour coupon {} (base={} DH, taux={}%)", 
                     montant, code, baseCommission, partenaire.getCommissionRate());
        } else {
            log.info("Aucune commission calculée pour coupon {} (offre sans valeur monétaire)", code);
        }

        log.info("Coupon {} validé par partenaire {}", code, partenaire.getName());
        return toCouponDTO(coupon);
    }

    // ─── COMMISSIONS PARTENAIRE ───────────────────────────────

    @Transactional
    public List<CommissionMensuelleDTO> getCommissions(Long userId) {
        Partenaire partenaire = resolvePartenaireAccount(userId);

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

    // ─── OUVRIR LA BOÎTE MYSTÈRE ────────────────────────────────

    @Transactional
    public ResultatMystereBoxDTO ouvrirMystereBox(Long recompenseId, Long userId) {
        Recompense recompense = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));

        if (!Boolean.TRUE.equals(recompense.getHasMystereBox()))
            throw new RuntimeException("Cette offre n'a pas de boîte mystère");

        List<MystereBoxItem> items = recompense.getMystereBoxItems();
        if (items.isEmpty())
            throw new RuntimeException("La boîte mystère est vide");

        // Vérifier le solde de points
        Integer solde = utilisateurClient.getPoints(userId);
        if (solde < recompense.getMystereBoxPoints())
            throw new RuntimeException("Points insuffisants. Solde: " + solde +
                    " — Requis: " + recompense.getMystereBoxPoints());

        // ── Tirage aléatoire pondéré ──
        int tirage = new Random().nextInt(100); // nombre entre 0 et 99
        int cumul = 0;
        MystereBoxItem itemGagne = items.get(items.size() - 1); // fallback = dernier item
        for (MystereBoxItem item : items) {
            cumul += item.getProbabilite();
            if (tirage < cumul) {
                itemGagne = item;
                break;
            }
        }

        // Générer un coupon pour le prix gagné
        String code = codeGenerator.generate();
        Coupon coupon = Coupon.builder()
                .userId(userId)
                .recompense(recompense)
                .code(code)
                .pointsUtilises(recompense.getMystereBoxPoints())
                .status(Coupon.CouponStatus.DISTRIBUE)
                .expireLe(java.time.LocalDateTime.now().plusDays(30))
                .build();
        Coupon saved = couponRepository.save(coupon);

        // Publier sur Kafka pour déduire les points
        recompenseProducer.publishRecompenseEchangee(
                RecompenseEchangeeEvent.builder()
                        .userId(userId)
                        .recompenseId(recompenseId)
                        .codeCoupon(code)
                        .pointsUtilises(recompense.getMystereBoxPoints())
                        .pointsRestants(solde - recompense.getMystereBoxPoints())
                        .recompenseTitle("[MYSTÈRE] " + itemGagne.getTitre())
                        .partenaireName(recompense.getPartenaire().getName())
                        .build());

        log.info("Boîte mystère ouverte par userId: {} — Prix: {} (probabilité: {}%)",
                userId, itemGagne.getTitre(), itemGagne.getProbabilite());

        return ResultatMystereBoxDTO.builder()
                .titrePrix(itemGagne.getTitre())
                .descriptionPrix(itemGagne.getDescription())
                .probabilite(itemGagne.getProbabilite())
                .coupon(toCouponDTO(saved))
                .build();
    }

    // ─── MÉTHODES PRIVÉES ────────────────────────────────────────

    private Partenaire requirePartenaire(Long userId) {
        return partenaireRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Partenaire non trouvé pour userId: " + userId));
    }

    private Partenaire resolvePartenaireAccount(Long userId) {
        return partenaireRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Création fiche partenaire pour userId={}", userId);
                    return partenaireRepository.save(Partenaire.builder()
                            .userId(userId)
                            .name("Mon établissement")
                            .category("Commerce local")
                            .vuesProfil(0L)
                            .clicsOffres(0L)
                            .build());
                });
    }

    private static long nullableLong(Long value) {
        return value == null ? 0L : value;
    }

    private static double tauxClicPercent(long vuesProfil, long clicsOffres) {
        return vuesProfil > 0
                ? Math.round((double) clicsOffres / vuesProfil * 10000.0) / 100.0
                : 0.0;
    }

    private String getCurrentMois() {
        java.time.YearMonth ym = java.time.YearMonth.now();
        return ym.getYear() + "-" +
                String.format("%02d", ym.getMonthValue());
    }

    /** Catalogue / détail public : offres cachées de la boîte non exposées. */
    private RecompenseDTO toPublicDTO(Recompense r) {
        RecompenseDTO dto = toDTO(r);
        if (Boolean.TRUE.equals(dto.getHasMystereBox()) && r.getMystereBoxItems() != null) {
            dto.setMystereBoxHiddenCount(r.getMystereBoxItems().size());
            dto.setMystereBoxItems(null);
        }
        return dto;
    }

    private RecompenseDTO toDTO(Recompense r) {
        List<MystereBoxItem> rawItems = r.getMystereBoxItems();
        List<MystereBoxItemDTO> boxItems = rawItems == null ? List.of() : rawItems.stream()
                .map(i -> MystereBoxItemDTO.builder()
                        .id(i.getId())
                        .titre(i.getTitre())
                        .description(i.getDescription())
                        .probabilite(i.getProbabilite())
                        .build())
                .collect(Collectors.toList());

        return RecompenseDTO.builder()
                .id(r.getId())
                .partenaireId(r.getPartenaire().getId())
                .partenaireUserId(r.getPartenaire().getUserId())
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
                .hasMystereBox(r.getHasMystereBox())
                .mystereBoxPoints(r.getMystereBoxPoints())
                .mystereBoxItems(boxItems)
                .couponsUtilises(couponRepository.countByRecompenseIdAndStatus(
                        r.getId(), Coupon.CouponStatus.UTILISE))
                .couponsDistribues(couponRepository.countByRecompenseId(r.getId()))
                .build();
    }

    private PartenaireProfilDTO toProfilDTO(Partenaire p) {
        return PartenaireProfilDTO.builder()
                .userId(p.getUserId())
                .name(p.getName())
                .category(p.getCategory())
                .address(p.getAddress())
                .city(p.getCity())
                .description(p.getDescription())
                .imageUrl(p.getImageUrl())
                .galleryImages(splitGallery(p.getGalleryImages()))
                .phone(p.getPhone())
                .website(p.getWebsite())
                .instagramUrl(p.getInstagramUrl())
                .facebookUrl(p.getFacebookUrl())
                .openingHours(p.getOpeningHours())
                .build();
    }

    private List<String> splitGallery(String galleryImages) {
        if (galleryImages == null || galleryImages.isBlank()) {
            return List.of();
        }
        return Arrays.stream(galleryImages.split("\\|\\|"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private String joinGallery(List<String> galleryImages) {
        return galleryImages.stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.joining("||"));
    }

    private AvisDTO toAvisDTO(AvisPartenaire a) {
        return AvisDTO.builder()
                .id(a.getId())
                .authorName(a.getAuthorName())
                .rating(a.getRating())
                .comment(a.getComment())
                .reponse(a.getReponse())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private String computeBadgeActuel(long couponsUtilises) {
        if (couponsUtilises >= 500) return "Ambassadeur Ecopria";
        if (couponsUtilises >= 200) return "Partenaire engagé";
        if (couponsUtilises >= 50) return "Nouveau";
        return "Découverte";
    }

    private List<BadgeProgressionDTO> buildBadgeProgression(long actuel) {
        List<BadgeProgressionDTO> list = new ArrayList<>();
        list.add(badgeTier("Nouveau", 50, actuel));
        list.add(badgeTier("Partenaire engagé", 200, actuel));
        list.add(badgeTier("Ambassadeur Ecopria", 500, actuel));
        return list;
    }

    private BadgeProgressionDTO badgeTier(String nom, int seuil, long actuel) {
        int pct = (int) Math.min(100, actuel * 100 / seuil);
        return BadgeProgressionDTO.builder()
                .nom(nom)
                .seuil(seuil)
                .actuel(actuel)
                .pourcentage(pct)
                .atteint(actuel >= seuil)
                .build();
    }

    private CouponDTO toCouponDTO(Coupon c) {
        Recompense recompense = c.getRecompense();
        String title = recompense != null ? recompense.getTitle() : "Offre";
        String imageUrl = recompense != null ? recompense.getImageUrl() : null;
        String partenaireName = null;
        if (recompense != null && recompense.getPartenaire() != null) {
            partenaireName = recompense.getPartenaire().getName();
        }
        return CouponDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .recompenseTitle(title)
                .recompenseImageUrl(imageUrl)
                .partenaireName(partenaireName)
                .pointsUtilises(c.getPointsUtilises())
                .status(c.getStatus())
                .expireLe(c.getExpireLe())
                .valideLe(c.getValideLe())
                .createdAt(c.getCreatedAt())
                .build();
    }
}