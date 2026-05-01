package com.ecopria.utilisateur.controller;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ecopria.utilisateur.dto.*;
import com.ecopria.utilisateur.model.*;
import com.ecopria.utilisateur.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
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

    @GetMapping("/association/{authId}")
    public ResponseEntity<Association> getAssociation(@PathVariable Long authId) {
        return ResponseEntity.ok(userService.getAssociation(authId));
    }

    @GetMapping("/partner/{authId}")
    public ResponseEntity<Partner> getPartner(@PathVariable Long authId) {
        return ResponseEntity.ok(userService.getPartner(authId));
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
}
