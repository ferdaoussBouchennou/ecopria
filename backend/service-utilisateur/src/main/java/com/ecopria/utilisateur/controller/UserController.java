package com.ecopria.utilisateur.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecopria.utilisateur.model.UserBadge;
import com.ecopria.utilisateur.model.PointHistory;
import com.ecopria.utilisateur.model.Profile;
import com.ecopria.utilisateur.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    // POST /api/users
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Profile newProfile) {
        try {
            Profile createdProfile = userService.createProfile(newProfile);
            return new ResponseEntity<>(createdProfile, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace(); // Ceci affichera l'erreur exacte dans 'docker logs'
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error : " + e.getMessage());
        }
    }

    // GET /api/users/{id}/profile
    @GetMapping("/{id}/profile")
    public ResponseEntity<Profile> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    // GET /api/users/leaderboard
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Profile>> getLeaderboard() {
        return ResponseEntity.ok(userService.getLeaderboard());
    }

    // GET /api/users/{id}/history
    @GetMapping("/{id}/history")
    public ResponseEntity<List<PointHistory>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getHistory(id));
    }

    // GET /api/users/{id}/badges
    @GetMapping("/{id}/badges")
    public ResponseEntity<List<UserBadge>> getBadges(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getBadges(id));
    }
}