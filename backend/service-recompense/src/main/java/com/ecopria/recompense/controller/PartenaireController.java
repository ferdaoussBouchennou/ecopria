package com.ecopria.recompense.controller;

import com.ecopria.recompense.dto.*;
import com.ecopria.recompense.service.RecompenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/partenaire")
@RequiredArgsConstructor
public class PartenaireController {

    private final RecompenseService recompenseService;

    // ── DASHBOARD ───────────────────────────────────────────
    // GET /api/partenaire/dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardPartenaireDTO> getDashboard(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.getDashboard(userId));
    }

    // ── MES OFFRES ──────────────────────────────────────────
    // GET /api/partenaire/offres
    @GetMapping("/offres")
    public ResponseEntity<List<RecompenseDTO>> getMesOffres(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.getMesOffres(userId));
    }

    // POST /api/partenaire/offres
    @PostMapping("/offres")
    public ResponseEntity<RecompenseDTO> creerOffre(
            @Valid @RequestBody CreateRecompenseDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recompenseService.creerOffre(dto, userId));
    }

    // PUT /api/partenaire/offres/{id}
    @PutMapping("/offres/{id}")
    public ResponseEntity<RecompenseDTO> modifierOffre(
            @PathVariable Long id,
            @Valid @RequestBody CreateRecompenseDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.modifierOffre(id, dto, userId));
    }

    // DELETE /api/partenaire/offres/{id}
    @DeleteMapping("/offres/{id}")
    public ResponseEntity<Void> desactiverOffre(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        recompenseService.desactiverOffre(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ── SCANNER COUPON ──────────────────────────────────────
    // POST /api/partenaire/valider-coupon
    @PostMapping("/valider-coupon")
    public ResponseEntity<CouponDTO> validerCoupon(
            @Valid @RequestBody ValiderCouponDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(
                recompenseService.validerCoupon(dto.getCode(), userId));
    }

    // ── COMMISSIONS ─────────────────────────────────────────
    // GET /api/partenaire/commissions
    @GetMapping("/commissions")
    public ResponseEntity<List<CommissionMensuelleDTO>> getCommissions(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.getCommissions(userId));
    }
}