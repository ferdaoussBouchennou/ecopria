package com.ecopria.recompense.controller;

import com.ecopria.recompense.dto.*;
import com.ecopria.recompense.model.Recompense.RecompenseType;
import com.ecopria.recompense.service.RecompenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recompenses")
@RequiredArgsConstructor
public class RecompenseController {

    private final RecompenseService recompenseService;

    // ── CATALOGUE PUBLIC ────────────────────────────────────
    // GET /api/recompenses
    // GET /api/recompenses?type=STOCK
    // GET /api/recompenses?type=REDUCTION
    @GetMapping
    public ResponseEntity<List<RecompenseDTO>> getCatalogue(
            @RequestParam(required = false) RecompenseType type) {
        return ResponseEntity.ok(recompenseService.getCatalogue(type));
    }

    // ── DÉTAIL ──────────────────────────────────────────────
    // GET /api/recompenses/{id}
    @GetMapping("/{id}")
    public ResponseEntity<RecompenseDTO> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(recompenseService.getDetail(id));
    }

    // ── ÉCHANGER ────────────────────────────────────────────
    // POST /api/recompenses/echanger
    // Header: X-User-Id: 42
    @PostMapping("/echanger")
    public ResponseEntity<CouponDTO> echanger(
            @Valid @RequestBody EchangerRecompenseDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recompenseService.echanger(dto.getRecompenseId(), userId));
    }

    // ── MES COUPONS ─────────────────────────────────────────
    // GET /api/recompenses/mes-coupons
    // Header: X-User-Id: 42
    @GetMapping("/mes-coupons")
    public ResponseEntity<List<CouponDTO>> getMesCoupons(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.getMesCoupons(userId));
    }

    // POST /api/recompenses/coupons/{couponId}/renvoyer-email
    @PostMapping("/coupons/{couponId}/renvoyer-email")
    public ResponseEntity<Void> renvoyerCouponParEmail(
            @PathVariable Long couponId,
            @RequestHeader("X-User-Id") Long userId) {
        recompenseService.renvoyerCouponParEmail(couponId, userId);
        return ResponseEntity.accepted().build();
    }

    // ── BOÎTE MYSTÈRE ────────────────────────────────────────
    // POST /api/recompenses/{id}/mystere-box
    // Le citoyen choisit d'ouvrir la boîte mystère plutôt que de prendre l'offre normale
    @PostMapping("/{id}/mystere-box")
    public ResponseEntity<ResultatMystereBoxDTO> ouvrirMystereBox(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recompenseService.ouvrirMystereBox(id, userId));
    }

    @PostMapping("/{id}/clic")
    public ResponseEntity<Void> enregistrerClic(@PathVariable Long id) {
        recompenseService.enregistrerClicOffre(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public/partenaire/{userId}")
    public ResponseEntity<PartenaireProfilDTO> getProfilPublic(@PathVariable Long userId) {
        return ResponseEntity.ok(recompenseService.getProfilPublic(userId));
    }

    @GetMapping("/public/partenaires")
    public ResponseEntity<List<PartenaireProfilDTO>> getPartenairesPublics() {
        return ResponseEntity.ok(recompenseService.getPartenairesPublics());
    }

    // ── OFFRES D'UN PARTENAIRE ─────────────────────────────
    // GET /api/recompenses/public/partenaire/{userId}/offres
    @GetMapping("/public/partenaire/{userId}/offres")
    public ResponseEntity<List<RecompenseDTO>> getOffresPartenaire(@PathVariable Long userId) {
        return ResponseEntity.ok(recompenseService.getOffresPartenaire(userId));
    }
}