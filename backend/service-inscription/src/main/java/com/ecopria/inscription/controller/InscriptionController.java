package com.ecopria.inscription.controller;

import com.ecopria.inscription.dto.InscriptionRequestDTO;
import com.ecopria.inscription.dto.InscriptionResponseDTO;
import com.ecopria.inscription.service.InscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inscriptions")
@CrossOrigin(origins = "*")
public class InscriptionController {

    private final InscriptionService inscriptionService;

    public InscriptionController(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @PostMapping
    public ResponseEntity<?> inscrire(@RequestBody InscriptionRequestDTO request) {
        try {
            InscriptionResponseDTO response = inscriptionService.inscrire(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur interne : " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<InscriptionResponseDTO>> getMesInscriptions(@PathVariable Long userId) {
        return ResponseEntity.ok(inscriptionService.getMesInscriptions(userId));
    }

    @GetMapping("/action/{actionId}")
    public ResponseEntity<List<InscriptionResponseDTO>> getInscriptionsParAction(@PathVariable Long actionId) {
        return ResponseEntity.ok(inscriptionService.getInscriptionsParAction(actionId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inscriptionService.getInscription(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{id}/confirmer-confiance")
    public ResponseEntity<?> confirmerAttenteConfiance(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inscriptionService.confirmerAttenteConfiance(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erreur", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{id}/refuser-confiance")
    public ResponseEntity<?> refuserAttenteConfiance(@PathVariable Long id) {
        try {
            inscriptionService.refuserAttenteConfiance(id);
            return ResponseEntity.ok(Map.of("message", "Inscription refusée"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erreur", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> desinscrire(@PathVariable Long id) {
        try {
            inscriptionService.desinscrire(id);
            return ResponseEntity.ok(Map.of("message", "Désinscription effectuée avec succès"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erreur", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "service-inscription", "port", "8084"));
    }
}