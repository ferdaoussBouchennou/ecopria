package com.ecopria.utilisateur.controller;

import java.util.List;
import java.util.Map;
import com.ecopria.utilisateur.dto.CitizenContactDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ecopria.utilisateur.dto.*;
import com.ecopria.utilisateur.model.*;
import com.ecopria.utilisateur.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({ "/api/users", "/api/utilisateurs" })
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<?> createCitizen(@Valid @RequestBody CitizenDTO citizenDTO) {
        try {
            return new ResponseEntity<>(userService.createCitizen(citizenDTO), HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<Citizen> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getCitizen(id));
    }

    @GetMapping("/{id}/points")
    public ResponseEntity<Map<String, Integer>> getPoints(@PathVariable Long id) {
        Integer totalPoints = userService.getTotalPoints(id);
        return ResponseEntity.ok(Map.of("totalPoints", totalPoints));
    }

    @GetMapping("/association/{authId}")
    public ResponseEntity<?> getAssociation(@PathVariable Long authId) {
        try {
            return ResponseEntity.ok(userService.getAssociation(authId));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Association non trouvée")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", e.getMessage(), "authId", authId));
            }
            throw e;
        }
    }

    @GetMapping("/partner/{authId}")
    public ResponseEntity<Partner> getPartner(@PathVariable Long authId) {
        return ResponseEntity.ok(userService.getPartner(authId));
    }

    @PutMapping("/{id}/trust-score")
    public ResponseEntity<Void> updateTrustScore(
            @PathVariable Long id,
            @RequestParam int delta) {
        userService.updateTrustScore(id, delta);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<Citizen> updateProfile(
            @PathVariable Long id,
            @RequestBody CitizenDTO dto) {
        return ResponseEntity.ok(userService.updateProfile(id, dto));
    }

    @PutMapping("/association/{authId}/profile")
    public ResponseEntity<Association> updateAssociationProfile(
            @PathVariable Long authId,
            @RequestBody AssociationDTO dto) {
        return ResponseEntity.ok(userService.updateAssociationProfile(authId, dto));
    }

    @PostMapping("/association/{authId}/logo")
    public ResponseEntity<Map<String, String>> uploadAssociationLogo(
            @PathVariable Long authId,
            @RequestParam("logo") org.springframework.web.multipart.MultipartFile logo) {
        String logoUrl = userService.uploadAssociationLogo(authId, logo);
        return ResponseEntity.ok(Map.of("logoUrl", logoUrl));
    }

    @PutMapping("/partner/{authId}/profile")
    public ResponseEntity<Partner> updatePartnerProfile(
            @PathVariable Long authId,
            @RequestBody PartnerDTO dto) {
        return ResponseEntity.ok(userService.updatePartnerProfile(authId, dto));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<PointHistory>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getHistory(id));
    }

    @GetMapping("/{id}/badges")
    public ResponseEntity<List<UserBadge>> getBadges(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getBadges(id));
    }

    @GetMapping("/{id}/badges/status")
    public ResponseEntity<List<BadgeStatusDTO>> getBadgesStatus(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getBadgesStatus(id));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(
            @RequestParam(defaultValue = "0") Long authId) {
        return ResponseEntity.ok(userService.getLeaderboard(authId));
    }

    @GetMapping("/{id}/preferences")
    public ResponseEntity<NotificationPreference> getPreferences(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getPreferences(id));
    }

    @PutMapping("/{id}/preferences")
    public ResponseEntity<Void> updatePreferences(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePreferencesDTO dto) {
        userService.updatePreferences(id, dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getDashboard(id));
    }

    /** Usage interne (service-notification) : e-mail pour authId. */
    @GetMapping("/internal/contact/{authId}/email")
    public ResponseEntity<Map<String, String>> internalEmailForNotifications(@PathVariable Long authId) {
        return userService.findEmailForAuthId(authId)
                .map(e -> ResponseEntity.ok(Map.of("email", e)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Citoyens d'une ville avec coordonnées de contact (notifications de masse par ville). */
    @GetMapping("/internal/citizens/contacts")
    public ResponseEntity<List<CitizenContactDTO>> internalCitizenContactsByCity(
            @RequestParam String city) {
        return ResponseEntity.ok(userService.findCitizenContactsByCity(city));
    }

    @GetMapping("/{id}/participant-profile")
    public ResponseEntity<Map<String, String>> getParticipantProfile(@PathVariable Long id) {
        return userService.getParticipantProfile(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
