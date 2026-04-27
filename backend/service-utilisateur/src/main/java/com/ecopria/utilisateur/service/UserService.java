package com.ecopria.utilisateur.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecopria.utilisateur.dto.*;
import com.ecopria.utilisateur.model.*;
import com.ecopria.utilisateur.repository.*;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final ProfileRepository profileRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public Profile createProfile(Profile newProfile) {
        if (newProfile.getUserId() == null) {
            throw new IllegalArgumentException("L'identifiant utilisateur (userId) est obligatoire.");
        }

        if (profileRepository.findByUserId(newProfile.getUserId()).isPresent()) {
            throw new IllegalStateException("Un utilisateur avec cet ID existe d�j� (userId: " + newProfile.getUserId() + ").");
        }

        Profile savedProfile = profileRepository.save(newProfile);

        NotificationPreference pref = new NotificationPreference();
        pref.setProfile(savedProfile);
        notificationPreferenceRepository.save(pref);

        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", savedProfile.getUserId());
            event.put("lastName", savedProfile.getLastName());
            event.put("firstName", savedProfile.getFirstName());
            kafkaTemplate.send("user.inscrit", event);
        } catch (Exception e) {
            System.err.println("Erreur Kafka (non bloquante) : " + e.getMessage());
        }

        return savedProfile;
    }

    @Transactional
    public void createProfile(Long userId, String lastName, String firstName) {
        if (profileRepository.findByUserId(userId).isPresent()) return;

        Profile profile = new Profile();
        profile.setUserId(userId);
        profile.setLastName(lastName);
        profile.setFirstName(firstName);
        Profile saved = profileRepository.save(profile);

        NotificationPreference pref = new NotificationPreference();
        pref.setProfile(saved);
        notificationPreferenceRepository.save(pref);
    }

    @Transactional
    public Profile updateProfile(Long userId, UpdateProfilDTO dto) {
        Profile profile = getProfile(userId);
        if (dto.getFirstName() != null && !dto.getFirstName().isBlank())
            profile.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null && !dto.getLastName().isBlank())
            profile.setLastName(dto.getLastName());
        if (dto.getCity() != null)
            profile.setCity(dto.getCity());
        return profileRepository.save(profile);
    }

    @Transactional
    public void awardPoints(PointsDTO dto) {
        Profile profile = profileRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Profil non trouv�"));

        profile.setTotalPoints(profile.getTotalPoints() + dto.getPoints());
        profile.setLevel(1 + profile.getTotalPoints() / 500);
        profileRepository.save(profile);

        PointHistory h = new PointHistory();
        h.setProfile(profile);
        h.setAmount(dto.getPoints());
        h.setType(PointHistory.TransactionType.CREDIT);
        h.setSource("action-" + dto.getActionId());
        h.setDescription("Points gagn�s pour participation");
        pointHistoryRepository.save(h);

        Map<String, Object> event = new HashMap<>();
        event.put("userId", dto.getUserId());
        event.put("pointsAdded", dto.getPoints());
        event.put("totalPoints", profile.getTotalPoints());
        event.put("actionId", dto.getActionId());
        kafkaTemplate.send("points.credites", event);

        checkBadges(profile);
    }

    @Transactional
    public void deductPoints(Long userId, Integer points) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profil non trouv�"));

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
        h.setDescription("Points d�pens�s pour une r�compense");
        pointHistoryRepository.save(h);
    }

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

                Map<String, Object> event = new HashMap<>();
                event.put("userId", profile.getUserId());
                event.put("badge", badge.getName());
                event.put("description", badge.getDescription());
                kafkaTemplate.send("badge.debloque", event);
            }
        }
    }

    public Profile getProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profil non trouv�"));
    }

    public List<LeaderboardEntryDTO> getLeaderboard(Long currentUserId) {
        List<Profile> top10 = profileRepository.findTop10ByOrderByTotalPointsDesc();
        List<LeaderboardEntryDTO> result = new ArrayList<>();
        for (int i = 0; i < top10.size(); i++) {
            Profile p = top10.get(i);
            LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
            dto.setRank(i + 1);
            dto.setLastName(p.getLastName());
            dto.setFirstName(p.getFirstName());
            dto.setCity(p.getCity() != null ? p.getCity() : "-");
            dto.setTotalPoints(p.getTotalPoints());
            dto.setMe(p.getUserId().equals(currentUserId));
            result.add(dto);
        }
        return result;
    }

    public List<PointHistory> getHistory(Long userId) {
        Profile profile = getProfile(userId);
        return pointHistoryRepository.findByProfileIdOrderByCreatedAtDesc(profile.getId());
    }

    public List<UserBadge> getBadges(Long userId) {
        Profile profile = getProfile(userId);
        return userBadgeRepository.findByProfileId(profile.getId());
    }

    public NotificationPreference getPreferences(Long userId) {
        Profile profile = getProfile(userId);
        return notificationPreferenceRepository.findByProfileId(profile.getId())
            .orElseGet(() -> {
                NotificationPreference pref = new NotificationPreference();
                pref.setProfile(profile);
                return notificationPreferenceRepository.save(pref);
            });
    }

    @Transactional
    public void updatePreferences(Long userId, UpdatePreferencesDTO dto) {
        Profile profile = getProfile(userId);
        NotificationPreference pref = notificationPreferenceRepository
            .findByProfileId(profile.getId())
            .orElseGet(() -> {
                NotificationPreference p = new NotificationPreference();
                p.setProfile(profile);
                return p;
            });
        if (dto.getNearbyActions() != null) pref.setNearbyActions(dto.getNearbyActions());
        if (dto.getReminders() != null) pref.setReminders(dto.getReminders());
        if (dto.getCatalogNews() != null) pref.setCatalogNews(dto.getCatalogNews());
        if (dto.getNewsletter() != null) pref.setNewsletter(dto.getNewsletter());
        notificationPreferenceRepository.save(pref);
    }
}
