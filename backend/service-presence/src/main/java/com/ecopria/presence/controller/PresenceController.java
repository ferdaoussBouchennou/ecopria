package com.ecopria.presence.controller;



import com.ecopria.presence.dto.PresenceResponseDTO;
import com.ecopria.presence.dto.ValidationByPinDTO;
import com.ecopria.presence.dto.ValidationRequestDTO;
import com.ecopria.presence.service.PresenceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/presences")
@CrossOrigin(origins = "*")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    // L'utilisateur scanne le QR → valide sa présence
    @PostMapping("/valider")
    public ResponseEntity<?> validerPresence(@RequestBody ValidationRequestDTO request) {
        try {
            PresenceResponseDTO response = presenceService.validerPresence(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("erreur", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur interne : " + e.getMessage()));
        }
    }

    // L'association valide manuellement via le PIN
    @PostMapping("/valider/pin")
    public ResponseEntity<?> validerPresenceParPin(@RequestBody ValidationByPinDTO request) {
        try {
            PresenceResponseDTO response = presenceService.validerPresenceParPin(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("erreur", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur interne : " + e.getMessage()));
        }
    }

    // L'association affiche le QR Code de son action
    @GetMapping("/qr/{actionId}")
    public ResponseEntity<?> getQrCode(@PathVariable Long actionId) {
        try {
            String qrCode = presenceService.getQrCodeParAction(actionId);
            String pinCode = presenceService.getPinCodeParAction(actionId);
            return ResponseEntity.ok(Map.of("actionId", actionId, "qrCode", qrCode, "pinCode", pinCode));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/action/{actionId}")
    public ResponseEntity<?> getPresencesParAction(@PathVariable Long actionId) {
        return ResponseEntity.ok(presenceService.getPresencesParAction(actionId));
    }

    /**
     * Vérifie si la présence d'un userId a été validée pour une action donnée.
     * Utilisé par le job AbsenceJob de service-inscription.
     */
    @GetMapping("/verif")
    public ResponseEntity<Map<String, Boolean>> verifierPresence(
            @RequestParam Long userId,
            @RequestParam Long actionId) {
        boolean presente = presenceService.estPresent(userId, actionId);
        return ResponseEntity.ok(Map.of("present", presente));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "service-presence",
                "port", "8085"));
    }
}
