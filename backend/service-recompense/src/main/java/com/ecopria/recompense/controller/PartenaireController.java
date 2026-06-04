package com.ecopria.recompense.controller;

import com.ecopria.recompense.dto.*;
import com.ecopria.recompense.service.RecompenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

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

    @GetMapping("/profil")
    public ResponseEntity<PartenaireProfilDTO> getProfil(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.getProfil(userId));
    }

    @PutMapping("/profil")
    public ResponseEntity<PartenaireProfilDTO> updateProfil(
            @RequestBody UpdatePartenaireProfilDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.updateProfil(userId, dto));
    }

    @PostMapping(value = "/profil/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadProfilCover(
            @RequestParam("image") MultipartFile image,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(Map.of("imageUrl", recompenseService.uploadPartenaireCover(userId, image)));
    }

    @PostMapping(value = "/profil/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadProfilGallery(
            @RequestParam("image") MultipartFile image,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(Map.of("imageUrl", recompenseService.uploadPartenaireGallery(userId, image)));
    }

    @PostMapping(value = "/offres/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadOffreImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(Map.of("imageUrl", recompenseService.uploadOffreImage(id, userId, image)));
    }

    @GetMapping("/visibilite")
    public ResponseEntity<VisibiliteDTO> getVisibilite(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.getVisibilite(userId));
    }

    @GetMapping("/avis")
    public ResponseEntity<List<AvisDTO>> getAvis(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.getAvis(userId));
    }

    @PutMapping("/avis/{avisId}/reponse")
    public ResponseEntity<AvisDTO> repondreAvis(
            @PathVariable Long avisId,
            @Valid @RequestBody RepondreAvisDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.repondreAvis(userId, avisId, dto));
    }

    @PatchMapping("/offres/{id}/toggle-active")
    public ResponseEntity<RecompenseDTO> toggleOffreActive(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(recompenseService.toggleOffreActive(id, userId));
    }
}