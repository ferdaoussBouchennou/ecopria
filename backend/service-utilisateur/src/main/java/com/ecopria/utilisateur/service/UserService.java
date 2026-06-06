package com.ecopria.utilisateur.service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecopria.utilisateur.dto.AssociationAdminUpsertRequest;
import com.ecopria.utilisateur.dto.*;
import com.ecopria.utilisateur.model.*;
import com.ecopria.utilisateur.repository.*;
import com.ecopria.utilisateur.mapper.UserMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final CitizenRepository citizenRepository;
    private final AssociationRepository associationRepository;
    private final PartnerRepository partnerRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final UserMapper userMapper;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:9092}")
    private String baseUrl;

    @Transactional
    public Citizen createCitizen(CitizenDTO citizenDTO) {
        if (citizenDTO.getAuthId() == null) {
            throw new IllegalArgumentException("L'identifiant auth (authId) est obligatoire.");
        }

        if (citizenRepository.findByAuthId(citizenDTO.getAuthId()).isPresent()) {
            throw new IllegalStateException("Un citoyen avec cet ID existe déjà (authId: " + citizenDTO.getAuthId() + ").");
        }

        return persistNewCitizen(citizenDTO);
    }

    /**
     * Idempotent : utilisé par Kafka ({@code citoyen.inscrit} / {@code user.inscrit}) pour tolérer
     * rejouer le message ou deux topics équivalents sans erreur.
     */
    @Transactional
    public Citizen syncCitizenFromKafka(CitizenDTO citizenDTO) {
        if (citizenDTO.getAuthId() == null) {
            throw new IllegalArgumentException("L'identifiant auth (authId) est obligatoire.");
        }
        Optional<Citizen> existing = citizenRepository.findByAuthId(citizenDTO.getAuthId());
        if (existing.isPresent()) {
            getOrCreatePreferences(citizenDTO.getAuthId());
            return existing.get();
        }
        return persistNewCitizen(citizenDTO);
    }

    private Citizen persistNewCitizen(CitizenDTO citizenDTO) {
        Citizen citizen = userMapper.toEntity(citizenDTO);
        Citizen savedCitizen = citizenRepository.save(citizen);
        // Kafka peut être rejoué / l'ordre peut varier: les préférences peuvent déjà exister.
        // On garantit qu'elles existent sans violer la contrainte UNIQUE(auth_id).
        getOrCreatePreferences(savedCitizen.getAuthId());

        return savedCitizen;
    }

    @Transactional
    public Association adminUpsertAssociation(AssociationAdminUpsertRequest request) {
        if (request.getAuthId() == null) {
            throw new IllegalArgumentException("authId obligatoire");
        }
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Le nom de l'association est obligatoire");
        }

        Association association = associationRepository.findByAuthId(request.getAuthId())
                .orElseGet(() -> {
                    Association created = new Association();
                    created.setAuthId(request.getAuthId());
                    return created;
                });

        association.setName(name);
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            association.setEmail(request.getEmail().trim());
        }
        if (request.getPhone() != null) {
            association.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            association.setAddress(request.getAddress().trim());
        }
        if (request.getCity() != null) {
            association.setCity(request.getCity().trim());
        }
        if (request.getDescription() != null) {
            association.setDescription(request.getDescription().trim());
        }
        if (request.getLogo() != null && !request.getLogo().isBlank()) {
            association.setLogo(request.getLogo().trim());
        }

        Association saved = associationRepository.save(association);
        getOrCreatePreferences(saved.getAuthId());
        return saved;
    }

    @Transactional
    public void createAssociation(AssociationDTO associationDTO) {
        if (associationDTO.getAuthId() == null) {
            throw new IllegalArgumentException("L'identifiant auth (authId) est obligatoire.");
        }

        // Idempotence Kafka: si l'event est rejoué, ne pas créer un doublon (auth_id est UNIQUE)
        if (associationRepository.findByAuthId(associationDTO.getAuthId()).isPresent()) {
            return;
        }

        Association asso = userMapper.toEntity(associationDTO);
        associationRepository.save(asso);
        
        getOrCreatePreferences(asso.getAuthId());
    }

    @Transactional
    public void createPartner(PartnerDTO partnerDTO) {
        if (partnerDTO.getAuthId() == null) {
            throw new IllegalArgumentException("L'identifiant auth (authId) est obligatoire.");
        }

        // Idempotence Kafka: si l'event est rejoué, ne pas créer un doublon (auth_id est UNIQUE)
        if (partnerRepository.findByAuthId(partnerDTO.getAuthId()).isPresent()) {
            return;
        }

        Partner partner = userMapper.toEntity(partnerDTO);
        partnerRepository.save(partner);
        
        getOrCreatePreferences(partner.getAuthId());
    }

    @Transactional
    public Citizen updateProfile(Long authId, CitizenDTO dto) {
        Citizen citizen = citizenRepository.findByAuthId(authId).orElseGet(() -> {
            CitizenDTO bootstrap = new CitizenDTO();
            bootstrap.setAuthId(authId);
            bootstrap.setFirstName(dto.getFirstName() != null ? dto.getFirstName() : "Citoyen");
            bootstrap.setLastName(dto.getLastName() != null ? dto.getLastName() : "");
            bootstrap.setEmail(dto.getEmail());
            bootstrap.setPhone(dto.getPhone());
            bootstrap.setAddress(dto.getAddress());
            bootstrap.setCity(dto.getCity());
            return syncCitizenFromKafka(bootstrap);
        });
        if (dto.getFirstName() != null && !dto.getFirstName().isBlank())
            citizen.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null && !dto.getLastName().isBlank())
            citizen.setLastName(dto.getLastName());
        if (dto.getEmail() != null && !dto.getEmail().isBlank())
            citizen.setEmail(dto.getEmail());
        if (dto.getPhone() != null && !dto.getPhone().isBlank())
            citizen.setPhone(dto.getPhone());
        if (dto.getAddress() != null)
            citizen.setAddress(dto.getAddress());
        if (dto.getCity() != null)
            citizen.setCity(dto.getCity());
        if (dto.getPhoto() != null) {
            String photo = dto.getPhoto().trim();
            if (!photo.isBlank() && !photo.startsWith("data:") && photo.length() <= 512) {
                citizen.setPhoto(photo);
            }
        }

        return citizenRepository.save(citizen);
    }

    @Transactional
    public Association updateAssociationProfile(Long authId, AssociationDTO dto) {
        Association association = getAssociation(authId);
        if (dto.getName() != null && !dto.getName().isBlank())
            association.setName(dto.getName());
        if (dto.getEmail() != null && !dto.getEmail().isBlank())
            association.setEmail(dto.getEmail());
        if (dto.getPhone() != null && !dto.getPhone().isBlank())
            association.setPhone(dto.getPhone());
        if (dto.getAddress() != null)
            association.setAddress(dto.getAddress());
        if (dto.getCity() != null)
            association.setCity(dto.getCity());
        if (dto.getDescription() != null)
            association.setDescription(dto.getDescription());
        if (dto.getLogo() != null)
            association.setLogo(dto.getLogo());
        return associationRepository.save(association);
    }

    @Transactional
    public Partner updatePartnerProfile(Long authId, PartnerDTO dto) {
        Partner partner = getPartner(authId);
        if (dto.getName() != null && !dto.getName().isBlank())
            partner.setName(dto.getName());
        if (dto.getEmail() != null && !dto.getEmail().isBlank())
            partner.setEmail(dto.getEmail());
        if (dto.getPhone() != null && !dto.getPhone().isBlank())
            partner.setPhone(dto.getPhone());
        if (dto.getAddress() != null)
            partner.setAddress(dto.getAddress());
        if (dto.getCity() != null)
            partner.setCity(dto.getCity());
        if (dto.getCategory() != null)
            partner.setCategory(dto.getCategory());
        if (dto.getDescription() != null)
            partner.setDescription(dto.getDescription());
        if (dto.getLogo() != null)
            partner.setLogo(dto.getLogo());
        return partnerRepository.save(partner);
    }

    @Transactional
    public void awardPoints(PointsDTO dto) {
        Citizen citizen = citizenRepository.findByAuthId(dto.getAuthId())
                .orElseThrow(() -> new RuntimeException("Citoyen non trouvé"));

        int current = citizen.getTotalPoints() != null ? citizen.getTotalPoints() : 0;
        citizen.setTotalPoints(current + dto.getPoints());
        citizenRepository.save(citizen);

        PointHistory h = new PointHistory();
        h.setProfile(citizen);
        h.setAmount(dto.getPoints());
        h.setType(PointHistory.TransactionType.CREDIT);
        h.setSource("action-" + dto.getActionId());
        h.setDescription("Points gagnés pour participation");
        pointHistoryRepository.save(h);

        Map<String, Object> event = new HashMap<>();
        event.put("auth_id", dto.getAuthId());
        event.put("userId", dto.getAuthId());
        event.put("points_added", dto.getPoints());
        event.put("total_points", citizen.getTotalPoints());
        event.put("totalPoints", citizen.getTotalPoints());
        event.put("action_id", dto.getActionId());
        event.put("actionId", dto.getActionId());
        if (citizen.getEmail() != null && !citizen.getEmail().isBlank()) {
            event.put("email", citizen.getEmail());
        }
        kafkaTemplate.send("points.credites", String.valueOf(dto.getAuthId()), event);

        checkBadges(citizen);
    }

    @Transactional
    public void deductPoints(Long authId, Integer points) {
        Citizen citizen = citizenRepository.findByAuthId(authId)
                .orElseThrow(() -> new RuntimeException("Citoyen non trouvé"));

        if (points == null || points <= 0) {
            throw new IllegalArgumentException("Le nombre de points a debiter doit etre positif");
        }

        int balance = citizen.getTotalPoints() != null ? citizen.getTotalPoints() : 0;
        if (balance < points) {
            throw new IllegalArgumentException("Points insuffisants pour effectuer cette operation");
        }

        citizen.setTotalPoints(balance - points);
        citizenRepository.save(citizen);

        PointHistory h = new PointHistory();
        h.setProfile(citizen);
        h.setAmount(points);
        h.setType(PointHistory.TransactionType.DEBIT);
        h.setSource("recompense");
        h.setDescription("Points dépensés pour une récompense");
        pointHistoryRepository.save(h);
    }

    private void checkBadges(Citizen citizen) {
        List<Badge> availableBadges = badgeRepository
                .findByRequiredPointsLessThanEqual(citizen.getTotalPoints());

        for (Badge badge : availableBadges) {
            boolean alreadyObtained = userBadgeRepository
                    .existsByProfileIdAndBadgeId(citizen.getId(), badge.getId());

            if (!alreadyObtained) {
                UserBadge ub = new UserBadge();
                ub.setProfile(citizen);
                ub.setBadge(badge);
                userBadgeRepository.save(ub);

                Map<String, Object> event = new HashMap<>();
                event.put("auth_id", citizen.getAuthId());
                event.put("userId", citizen.getAuthId());
                event.put("badge_name", badge.getName());
                event.put("badge", badge.getName());
                event.put("description", badge.getDescription());
                if (citizen.getEmail() != null && !citizen.getEmail().isBlank()) {
                    event.put("email", citizen.getEmail());
                }
                kafkaTemplate.send("badge.debloque", String.valueOf(citizen.getAuthId()), event);
            }
        }
    }

    public Citizen getCitizen(Long authId) {
        return citizenRepository.findByAuthId(authId)
                .orElseThrow(() -> new RuntimeException("Citoyen non trouvé"));
    }

    public Integer getTotalPoints(Long authId) {
        Citizen citizen = getCitizen(authId);
        return citizen.getTotalPoints() != null ? citizen.getTotalPoints() : 0;
    }

    @Transactional
    public void deductPoints(Long authId, Integer points, String raison) {
        Citizen citizen = getCitizen(authId);
        Integer currentPoints = citizen.getTotalPoints() != null ? citizen.getTotalPoints() : 0;
        
        if (currentPoints < points) {
            throw new RuntimeException("Points insuffisants. Solde: " + currentPoints + " - Requis: " + points);
        }
        
        // Déduire les points
        Integer newTotal = currentPoints - points;
        citizen.setTotalPoints(newTotal);
        citizenRepository.save(citizen);
        
        // Créer une entrée dans l'historique
        PointHistory history = new PointHistory();
        history.setProfile(citizen);
        history.setAmount(points);  // Positif, le type DEBIT indique la déduction
        history.setType(PointHistory.TransactionType.DEBIT);
        history.setSource("ECHANGE_RECOMPENSE");
        history.setDescription(raison != null ? raison : "Échange de récompense");
        // createdAt est initialisé automatiquement dans le modèle
        pointHistoryRepository.save(history);
        
        log.info("Points déduits: {} points pour authId: {} - Nouveau solde: {}", points, authId, newTotal);
    }

    @Transactional
    public void updateTrustScore(Long authId, int delta) {
        Citizen citizen = getCitizen(authId);
        int current = citizen.getTrustScore() != null ? citizen.getTrustScore() : 100;
        int updated = Math.max(0, Math.min(100, current + delta));
        citizen.setTrustScore(updated);
        citizenRepository.save(citizen);
    }

    public Association getAssociation(Long authId) {
        return associationRepository.findByAuthId(authId)
                .orElseGet(() -> {
                    Association asso = new Association();
                    asso.setAuthId(authId);
                    asso.setName("Association"); // Nom par défaut
                    Association saved = associationRepository.save(asso);
                    getOrCreatePreferences(saved.getAuthId());
                    return saved;
                });
    }

    @Transactional(readOnly = true)
    public List<AssociationPublicProfilDTO> getAssociationsPublics() {
        return associationRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(Association::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toAssociationPublicProfilDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssociationPublicProfilDTO getAssociationPublic(Long authId) {
        Association association = associationRepository.findByAuthId(authId)
                .orElseThrow(() -> new RuntimeException("Association non trouvée"));
        return toAssociationPublicProfilDTO(association);
    }

    private AssociationPublicProfilDTO toAssociationPublicProfilDTO(Association association) {
        return AssociationPublicProfilDTO.builder()
                .id(association.getId())
                .authId(association.getAuthId())
                .name(association.getName())
                .city(association.getCity())
                .address(association.getAddress())
                .description(association.getDescription())
                .logo(association.getLogo())
                .build();
    }

    public Partner getPartner(Long authId) {
        return partnerRepository.findByAuthId(authId)
                .orElseGet(() -> {
                    Partner partner = new Partner();
                    partner.setAuthId(authId);
                    partner.setName("Partenaire"); // Nom par défaut
                    Partner saved = partnerRepository.save(partner);
                    getOrCreatePreferences(saved.getAuthId());
                    return saved;
                });
    }

    public List<LeaderboardEntryDTO> getLeaderboard(Long currentAuthId) {
        List<Citizen> top10 = citizenRepository.findTop10ByOrderByTotalPointsDesc();
        if (top10.isEmpty()) {
            return List.of();
        }

        List<Long> citizenIds = top10.stream().map(Citizen::getId).toList();
        Map<Long, List<LeaderboardBadgeDTO>> badgesByCitizen = userBadgeRepository
                .findByProfileIdInWithBadge(citizenIds)
                .stream()
                .collect(Collectors.groupingBy(
                        ub -> ub.getProfile().getId(),
                        Collectors.mapping(this::toLeaderboardBadgeDTO, Collectors.toList())));

        List<LeaderboardEntryDTO> result = new ArrayList<>();
        for (int i = 0; i < top10.size(); i++) {
            Citizen c = top10.get(i);
            LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
            dto.setRank(i + 1);
            dto.setLastName(c.getLastName());
            dto.setFirstName(c.getFirstName());
            dto.setCity(c.getCity() != null ? c.getCity() : "-");
            dto.setTotalPoints(c.getTotalPoints());
            dto.setMe(c.getAuthId().equals(currentAuthId));
            dto.setBadges(badgesByCitizen.getOrDefault(c.getId(), List.of()));
            result.add(dto);
        }
        return result;
    }

    private LeaderboardBadgeDTO toLeaderboardBadgeDTO(UserBadge userBadge) {
        Badge badge = userBadge.getBadge();
        LeaderboardBadgeDTO dto = new LeaderboardBadgeDTO();
        dto.setId(badge.getId());
        dto.setName(badge.getName());
        dto.setIcon(badge.getIcon());
        dto.setDescription(badge.getDescription());
        return dto;
    }

    public List<PointHistory> getHistory(Long authId) {
        Citizen citizen = getCitizen(authId);
        return pointHistoryRepository.findByProfileIdOrderByCreatedAtDesc(citizen.getId());
    }

    public List<UserBadge> getBadges(Long authId) {
        Citizen citizen = getCitizen(authId);
        return userBadgeRepository.findByProfileId(citizen.getId());
    }

    public List<BadgeStatusDTO> getBadgesStatus(Long authId) {
        Citizen citizen = getCitizen(authId);
        Set<Long> earnedBadgeIds = userBadgeRepository.findByProfileId(citizen.getId()).stream()
                .map(ub -> ub.getBadge().getId())
                .collect(Collectors.toCollection(HashSet::new));

        return badgeRepository.findAll().stream()
                .sorted(Comparator.comparing(Badge::getRequiredPoints))
                .map(badge -> {
                    BadgeStatusDTO dto = new BadgeStatusDTO();
                    dto.setId(badge.getId());
                    dto.setName(badge.getName());
                    dto.setDescription(badge.getDescription());
                    dto.setIcon(badge.getIcon());
                    dto.setRequiredPoints(badge.getRequiredPoints());
                    dto.setObtained(earnedBadgeIds.contains(badge.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public NotificationPreference getPreferences(Long authId) {
        return getOrCreatePreferences(authId);
    }

    @Transactional
    public void updatePreferences(Long authId, UpdatePreferencesDTO dto) {
        NotificationPreference pref = getOrCreatePreferences(authId);
        if (dto.getNearbyActions() != null) pref.setNearbyActions(dto.getNearbyActions());
        if (dto.getReminders() != null) pref.setReminders(dto.getReminders());
        if (dto.getCatalogNews() != null) pref.setCatalogNews(dto.getCatalogNews());
        if (dto.getNewsletter() != null) pref.setNewsletter(dto.getNewsletter());
        notificationPreferenceRepository.save(pref);
    }

    private NotificationPreference getOrCreatePreferences(Long authId) {
        return notificationPreferenceRepository.findByAuthId(authId)
                .orElseGet(() -> {
                    NotificationPreference pref = new NotificationPreference();
                    pref.setAuthId(authId);
                    return notificationPreferenceRepository.save(pref);
                });
    }

    public DashboardDTO getDashboard(Long authId) {
        DashboardDTO dash = new DashboardDTO();
        
        // Tester Citoyen
        java.util.Optional<Citizen> citizenOpt = citizenRepository.findByAuthId(authId);
        if (citizenOpt.isPresent()) {
            Citizen c = citizenOpt.get();
            dash.setUserType("CITIZEN");
            dash.setFirstName(c.getFirstName());
            dash.setLastName(c.getLastName());
            dash.setName(c.getFirstName() + " " + c.getLastName());
            dash.setPhoto(c.getPhoto());
            dash.setCity(c.getCity());
            dash.setTotalPoints(c.getTotalPoints());
            dash.setLevel(c.getLevel());
            // ... autres infos citoyen (badges, etc)
            return dash;
        }
        
        // Tester Association
        java.util.Optional<Association> assoOpt = associationRepository.findByAuthId(authId);
        if (assoOpt.isPresent()) {
            Association a = assoOpt.get();
            dash.setUserType("ASSOCIATION");
            dash.setName(a.getName());
            dash.setPhoto(a.getLogo());
            dash.setCity(a.getCity());
            dash.setDescription(a.getDescription());
            return dash;
        }
        
        // Tester Partenaire
        java.util.Optional<Partner> partOpt = partnerRepository.findByAuthId(authId);
        if (partOpt.isPresent()) {
            Partner p = partOpt.get();
            dash.setUserType("PARTNER");
            dash.setName(p.getName());
            dash.setPhoto(p.getLogo());
            dash.setCity(p.getCity());
            dash.setDescription(p.getDescription());
            return dash;
        }
        
        throw new RuntimeException("Utilisateur non trouvé");
    }

    /** Résout l'e-mail pour notification (citoyen, association ou partenaire). */
    public Optional<String> findEmailForAuthId(Long authId) {
        Optional<String> fromCitizen = citizenRepository.findByAuthId(authId)
                .map(Citizen::getEmail)
                .filter(e -> e != null && !e.isBlank());
        if (fromCitizen.isPresent()) {
            return fromCitizen;
        }
        Optional<String> fromAsso = associationRepository.findByAuthId(authId)
                .map(Association::getEmail)
                .filter(e -> e != null && !e.isBlank());
        if (fromAsso.isPresent()) {
            return fromAsso;
        }
        return partnerRepository.findByAuthId(authId)
                .map(Partner::getEmail)
                .filter(e -> e != null && !e.isBlank());
    }

    /** Citoyens d'une ville (notifications ciblées action.creee, etc.). */
    public List<CitizenContactDTO> findCitizenContactsByCity(String city) {
        if (city == null || city.isBlank()) {
            return List.of();
        }
        return citizenRepository.findByCityIgnoreCase(city.trim()).stream()
                .map(c -> new CitizenContactDTO(c.getAuthId(), c.getEmail(), c.getFirstName()))
                .collect(Collectors.toList());
    }

    public boolean isCitizen(Long authId) {
        return authId != null && citizenRepository.findByAuthId(authId).isPresent();
    }

    public Optional<Map<String, String>> getParticipantProfile(Long authId) {
        Optional<Citizen> citOpt = citizenRepository.findByAuthId(authId);
        if (citOpt.isPresent()) {
            Citizen c = citOpt.get();
            Map<String, String> map = new HashMap<>();
            map.put("firstName", c.getFirstName() != null ? c.getFirstName() : "");
            map.put("lastName", c.getLastName() != null ? c.getLastName() : "");
            map.put("email", c.getEmail() != null ? c.getEmail() : "");
            map.put("phone", c.getPhone() != null ? c.getPhone() : "");
            map.put("city", c.getCity() != null ? c.getCity() : "");
            map.put("photo", c.getPhoto() != null ? c.getPhoto() : "");
            return Optional.of(map);
        }
        
        Optional<Association> assoOpt = associationRepository.findByAuthId(authId);
        if (assoOpt.isPresent()) {
            Association a = assoOpt.get();
            Map<String, String> map = new HashMap<>();
            map.put("firstName", "");
            map.put("lastName", a.getName() != null ? a.getName() : "");
            map.put("email", a.getEmail() != null ? a.getEmail() : "");
            map.put("phone", a.getPhone() != null ? a.getPhone() : "");
            map.put("city", a.getCity() != null ? a.getCity() : "");
            map.put("photo", a.getLogo() != null ? a.getLogo() : "");
            return Optional.of(map);
        }
        
        Optional<Partner> partOpt = partnerRepository.findByAuthId(authId);
        if (partOpt.isPresent()) {
            Partner p = partOpt.get();
            Map<String, String> map = new HashMap<>();
            map.put("firstName", "");
            map.put("lastName", p.getName() != null ? p.getName() : "");
            map.put("email", p.getEmail() != null ? p.getEmail() : "");
            map.put("phone", p.getPhone() != null ? p.getPhone() : "");
            map.put("city", p.getCity() != null ? p.getCity() : "");
            map.put("photo", p.getLogo() != null ? p.getLogo() : "");
            return Optional.of(map);
        }
        return Optional.empty();
    }

    @Transactional
    public String uploadCitizenPhoto(Long authId, org.springframework.web.multipart.MultipartFile photo) {
        Citizen citizen = getCitizen(authId);

        if (photo.isEmpty()) {
            throw new RuntimeException("Le fichier photo est vide");
        }

        String contentType = photo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Le fichier doit être une image");
        }

        if (photo.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("La photo ne peut pas dépasser 5 Mo");
        }

        try {
            Path uploadPath = Paths.get(uploadDir, "citizens");
            Files.createDirectories(uploadPath);

            String originalFilename = photo.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "citizen_" + authId + "_" + UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String photoUrl = "/api/users/uploads/citizens/" + filename;
            citizen.setPhoto(photoUrl);
            citizenRepository.save(citizen);

            log.info("Photo uploadée pour le citoyen authId={}: {}", authId, filename);
            return photoUrl;

        } catch (Exception e) {
            log.error("Erreur lors de l'upload de la photo pour le citoyen authId={}", authId, e);
            throw new RuntimeException("Erreur lors de l'upload de la photo: " + e.getMessage());
        }
    }

    @Transactional
    public String uploadAssociationLogo(Long authId, org.springframework.web.multipart.MultipartFile logo) {
        Association association = getAssociation(authId);

        if (logo.isEmpty()) {
            throw new RuntimeException("Le fichier logo est vide");
        }

        String contentType = logo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Le fichier doit être une image");
        }

        if (logo.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Le logo ne peut pas dépasser 5 Mo");
        }

        try {
            Path uploadPath = Paths.get(uploadDir, "associations");
            Files.createDirectories(uploadPath);

            String originalFilename = logo.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "association_" + authId + "_" + UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.copy(logo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String logoUrl = baseUrl + "/uploads/associations/" + filename;

            association.setLogo(logoUrl);
            associationRepository.save(association);

            log.info("Logo uploadé pour l'association authId={}: {}", authId, filename);
            return logoUrl;

        } catch (Exception e) {
            log.error("Erreur lors de l'upload du logo pour l'association authId={}", authId, e);
            throw new RuntimeException("Erreur lors de l'upload du logo: " + e.getMessage());
        }
    }
}
