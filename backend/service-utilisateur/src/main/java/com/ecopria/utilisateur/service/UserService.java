package com.ecopria.utilisateur.service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecopria.utilisateur.dto.PointsDTO;
import com.ecopria.utilisateur.model.Badge;
import com.ecopria.utilisateur.model.UserBadge;
import com.ecopria.utilisateur.model.PointHistory;
import com.ecopria.utilisateur.model.Profile;
import com.ecopria.utilisateur.repository.BadgeRepository;
import com.ecopria.utilisateur.repository.UserBadgeRepository;
import com.ecopria.utilisateur.repository.PointHistoryRepository;
import com.ecopria.utilisateur.repository.ProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final ProfileRepository profileRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    // Méthode pour le POST depuis le contrôleur
    @Transactional
    public Profile createProfile(Profile newProfile) {
        if (newProfile.getUserId() == null) {
            throw new IllegalArgumentException("L'identifiant utilisateur (userId) est obligatoire.");
        }

        // Vérifier si un profil existe déjà
        if (profileRepository.findByUserId(newProfile.getUserId()).isPresent()) {
            throw new IllegalStateException("Un utilisateur avec cet ID existe déjà (userId: " + newProfile.getUserId() + ").");
        }

        // Sauvegarder le nouveau profil
        Profile savedProfile = profileRepository.save(newProfile);

        // Publier un événement sur Kafka (de manière asynchrone pour ne pas bloquer le contrôleur)
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("id", savedProfile.getUserId());
            event.put("lastName", savedProfile.getLastName());
            event.put("firstName", savedProfile.getFirstName());
            kafkaTemplate.send("user.inscrit", event);
        } catch (Exception e) {
            System.err.println("Erreur Kafka (non bloquante) : " + e.getMessage());
        }

        return savedProfile;
    }

    // Créer profil quand user.inscrit reçu depuis Kafka
    @Transactional
    public void createProfile(Long userId, String lastName, String firstName) {
        if (profileRepository.findByUserId(userId).isPresent()) return;

        Profile profile = new Profile();
        profile.setUserId(userId);
        profile.setLastName(lastName);
        profile.setFirstName(firstName);
        profileRepository.save(profile);
    }

    // Créditer les points quand presence.validee reçu depuis Kafka
    @Transactional
    public void awardPoints(PointsDTO dto) {
        Profile profile = profileRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Profil non trouvé"));

        // Mettre à jour les points
        profile.setTotalPoints(profile.getTotalPoints() + dto.getPoints());

        // Mettre à jour le niveau (1 niveau par 500 points)
        profile.setLevel(1 + profile.getTotalPoints() / 500);
        profileRepository.save(profile);

        // Enregistrer dans historique
        PointHistory h = new PointHistory();
        h.setProfile(profile);
        h.setAmount(dto.getPoints());
        h.setType(PointHistory.TransactionType.CREDIT);
        h.setSource("action-" + dto.getActionId());
        h.setDescription("Points gagnés pour participation");
        pointHistoryRepository.save(h);

        // Publier sur Kafka : points.credites
        Map<String, Object> event = new HashMap<>();
        event.put("userId", dto.getUserId());
        event.put("pointsAdded", dto.getPoints());
        event.put("totalPoints", profile.getTotalPoints());
        event.put("actionId", dto.getActionId());
        kafkaTemplate.send("points.credites", event);

        // Vérifier et débloquer les badges
        checkBadges(profile);
    }

    // Débiter les points quand recompense.echangee reçu depuis Kafka
    @Transactional
    public void deductPoints(Long userId, Integer points) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profil non trouvé"));

        if (points == null || points <= 0) {
            throw new IllegalArgumentException("Le nombre de points a debiter doit etre positif");
        }

        if (profile.getTotalPoints() < points) {
            throw new IllegalArgumentException("Points insuffisants pour effectuer cette operation");
        }

        profile.setTotalPoints(profile.getTotalPoints() - points);
        profile.setLevel(1 + profile.getTotalPoints() / 500);
        profileRepository.save(profile);

        PointHistory h = new PointHistory();
        h.setProfile(profile);
        h.setAmount(points);
        h.setType(PointHistory.TransactionType.DEBIT);
        h.setSource("recompense");
        h.setDescription("Points dépensés pour une récompense");
        pointHistoryRepository.save(h);
    }

    // Vérifier et débloquer les badges automatiquement
    private void checkBadges(Profile profile) {
        List<Badge> availableBadges = badgeRepository
                .findByRequiredPointsLessThanEqual(profile.getTotalPoints());

        for (Badge badge : availableBadges) {
            boolean alreadyObtained = userBadgeRepository
                    .existsByProfileIdAndBadgeId(profile.getId(), badge.getId());

            if (!alreadyObtained) {
                UserBadge ub = new UserBadge();
                ub.setProfile(profile);
                ub.setBadge(badge);
                userBadgeRepository.save(ub);

                // Publier sur Kafka : badge.debloque
                Map<String, Object> event = new HashMap<>();
                event.put("userId", profile.getUserId());
                event.put("badge", badge.getName());
                event.put("description", badge.getDescription());
                kafkaTemplate.send("badge.debloque", event);
            }
        }
    }

    // Récupérer le profil
    public Profile getProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profil non trouvé"));
    }

    // Classement
    public List<Profile> getLeaderboard() {
        return profileRepository.findTop10ByOrderByTotalPointsDesc();
    }

    public List<PointHistory> getHistory(Long userId) {
        Profile profile = getProfile(userId);
        return pointHistoryRepository.findByProfileIdOrderByCreatedAtDesc(profile.getId());
    }

    public List<UserBadge> getBadges(Long userId) {
        Profile profile = getProfile(userId);
        return userBadgeRepository.findByProfileId(profile.getId());
    }
}