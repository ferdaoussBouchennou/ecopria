package com.ecopria.utilisateur.controller;

import java.util.List;
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
    public ResponseEntity<?> createUser(@RequestBody Profile newProfile) {
        try {
            return new ResponseEntity<>(userService.createProfile(newProfile), HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<Profile> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<Profile> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfilDTO dto) {
        return ResponseEntity.ok(userService.updateProfile(id, dto));
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
            @RequestParam(defaultValue = "0") Long userId) {
        return ResponseEntity.ok(userService.getLeaderboard(userId));
    }

    @GetMapping("/{id}/preferences")
    public ResponseEntity<NotificationPreference> getPreferences(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getPreferences(id));
    }

    @PutMapping("/{id}/preferences")
    public ResponseEntity<Void> updatePreferences(
            @PathVariable Long id,
            @RequestBody UpdatePreferencesDTO dto) {
        userService.updatePreferences(id, dto);
        return ResponseEntity.ok().build();
    }
}
