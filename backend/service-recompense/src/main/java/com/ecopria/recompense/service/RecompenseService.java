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

        List<CouponDTO> recents = couponRepository
                .findRecentByPartenaire(partenaire.getId(), PageRequest.of(0, 8))
                .stream().map(this::toCouponDTO).collect(Collectors.toList());

        Double noteMoyenne = avisPartenaireRepository.averageRatingByPartenaire(partenaire.getId());
        Long nombreAvis = avisPartenaireRepository.countByPartenaireId(partenaire.getId());

        return DashboardPartenaireDTO.builder()
                .partenaireName(partenaire.getName())
                .vuesProfil(partenaire.getVuesProfil())
                .clicsOffres(partenaire.getClicsOffres())
                .tauxClic(partenaire.getVuesProfil() > 0
                        ? Math.round((double) partenaire.getClicsOffres() / partenaire.getVuesProfil() * 10000.0) / 100.0
                        : 0.0)
                .couponsDistribues(distribues)
                .couponsUtilises(utilises)
                .tauxUtilisation(Math.round(taux * 100.0) / 100.0)
                .noteMoyenne(noteMoyenne != null ? Math.round(noteMoyenne * 10.0) / 10.0 : null)
                .nombreAvis(nombreAvis)
                .commissionsARegler(commissions != null ? commissions : 0.0)
                .badgeActuel(computeBadgeActuel(utilises))
                .offresActives(offres)
                .echangesRecents(recents)
                .build();
    }

    // ─── PROFIL PUBLIC PARTENAIRE ────────────────────────────

    @Transactional(readOnly = true)
    public PartenaireProfilDTO getProfil(Long userId) {
        return toProfilDTO(getPartenaireByUserId(userId));
    }

    @Transactional
    public PartenaireProfilDTO updateProfil(Long userId, UpdatePartenaireProfilDTO dto) {
        Partenaire p = getPartenaireByUserId(userId);
        if (dto.getName() != null) p.setName(dto.getName());
        if (dto.getCategory() != null) p.setCategory(dto.getCategory());
        if (dto.getAddress() != null) p.setAddress(dto.getAddress());
        if (dto.getCity() != null) p.setCity(dto.getCity());
        if (dto.getDescription() != null) p.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null) p.setImageUrl(dto.getImageUrl());
        return toProfilDTO(partenaireRepository.save(p));
    }

    @Transactional
    public PartenaireProfilDTO getProfilPublic(Long partenaireUserId) {
        Partenaire p = getPartenaireByUserId(partenaireUserId);
        p.setVuesProfil(p.getVuesProfil() + 1);
        partenaireRepository.save(p);
        return toProfilDTO(p);
    }

    // ─── VISIBILITÉ & AVIS ───────────────────────────────────

    @Transactional(readOnly = true)
    public VisibiliteDTO getVisibilite(Long userId) {
        Partenaire p = getPartenaireByUserId(userId);
        Long distribues = couponRepository.countByRecompensePartenaireId(p.getId());
        Long utilises = couponRepository.countByRecompensePartenaireIdAndStatus(
                p.getId(), Coupon.CouponStatus.UTILISE);
        double tauxConv = distribues > 0 ? (double) utilises / distribues * 100 : 0;
        double tauxClic = p.getVuesProfil() > 0
                ? (double) p.getClicsOffres() / p.getVuesProfil() * 100 : 0;
        Double note = avisPartenaireRepository.averageRatingByPartenaire(p.getId());
        Long nbAvis = avisPartenaireRepository.countByPartenaireId(p.getId());

        return VisibiliteDTO.builder()
                .vuesProfil(p.getVuesProfil())
                .clicsOffres(p.getClicsOffres())
                .tauxClic(Math.round(tauxClic * 10.0) / 10.0)
                .noteMoyenne(note != null ? Math.round(note * 10.0) / 10.0 : null)
                .nombreAvis(nbAvis)
                .couponsDistribues(distribues)
                .couponsUtilises(utilises)
                .tauxConversion(Math.round(tauxConv * 100.0) / 100.0)
                .badgeActuel(computeBadgeActuel(utilises))
                .progressionBadges(buildBadgeProgression(utilises))
                .build();
    }

    @Transactional(readOnly = true)
    public List<AvisDTO> getAvis(Long userId) {
        Partenaire p = getPartenaireByUserId(userId);
        return avisPartenaireRepository.findByPartenaireIdOrderByCreatedAtDesc(p.getId())
                .stream().map(this::toAvisDTO).collect(Collectors.toList());
    }

    @Transactional
    public AvisDTO repondreAvis(Long userId, Long avisId, RepondreAvisDTO dto) {
        Partenaire p = getPartenaireByUserId(userId);
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
        p.setClicsOffres(p.getClicsOffres() + 1);
        partenaireRepository.save(p);
    }

    @Transactional
    public RecompenseDTO toggleOffreActive(Long recompenseId, Long userId) {
        Partenaire partenaire = getPartenaireByUserId(userId);
        Recompense recompense = recompenseRepository.findById(recompenseId)
                .orElseThrow(() -> new RuntimeException("Récompense non trouvée"));
        if (!recompense.getPartenaire().getId().equals(partenaire.getId())) {
            throw new RuntimeException("Vous n'êtes pas le propriétaire de cette offre");
        }
        recompense.setIsActive(!Boolean.TRUE.equals(recompense.getIsActive()));
        return toDTO(recompenseRepository.save(recompense));
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
        Partenaire partenaire = getPartenaireByUserId(userId);
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
        List<MystereBoxItemDTO> boxItems = r.getMystereBoxItems().stream()
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
                .build();
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