package com.ecopria.action.controller;

import com.ecopria.action.dto.*;
import com.ecopria.action.service.ActionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/actions")
@RequiredArgsConstructor
public class ActionController {

    private final ActionService actionService;

    // ── LISTE PUBLIQUE ──────────────────────────────────────
    // GET /api/actions
    // GET /api/actions?categoryId=1
    @GetMapping
    public ResponseEntity<List<ActionSummaryDTO>> getAll(
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(actionService.getAllPublished(categoryId));
    }

    // ── CARTE ───────────────────────────────────────────────
    // GET /api/actions/carte
    // GET /api/actions/carte?categoryId=1
    @GetMapping("/carte")
    public ResponseEntity<List<ActionSummaryDTO>> getForMap(
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(actionService.getForMap(categoryId));
    }

    // ── DÉTAIL ──────────────────────────────────────────────
    // GET /api/actions/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ActionDetailDTO> getDetail(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(actionService.getDetail(id, userId));
    }

    // ── DISPONIBILITÉ — appelé par service-inscription ──────
    // GET /api/actions/{id}/disponibilite
    @GetMapping("/{id}/disponibilite")
    public ResponseEntity<ActionAvailabilityDTO> getAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(actionService.getAvailability(id));
    }

    // ── CRÉER — association uniquement ──────────────────────
    // POST /api/actions
    // Header: X-User-Id: 42
    @PostMapping
    public ResponseEntity<ActionDetailDTO> create(
            @Valid @RequestBody CreateActionDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(actionService.create(dto, userId));
    }

    // ── PUBLIER — passer de DRAFT à PUBLISHED ───────────────
    // PUT /api/actions/{id}/publier
    @PutMapping("/{id}/publier")
    public ResponseEntity<ActionDetailDTO> publish(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(actionService.publish(id, userId));
    }

    // ── MODIFIER ────────────────────────────────────────────
    // PUT /api/actions/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ActionDetailDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateActionDTO dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(actionService.update(id, dto, userId));
    }

    // ── ANNULER ─────────────────────────────────────────────
    // DELETE /api/actions/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false, defaultValue = "") String reason) {
        actionService.cancel(id, userId, reason);
        return ResponseEntity.noContent().build();
    }

    // ── DASHBOARD ASSOCIATION ────────────────────────────────
    // GET /api/actions/mes-actions
    @GetMapping("/mes-actions")
    public ResponseEntity<List<ActionSummaryDTO>> getMyActions(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(actionService.getMyActions(userId));
    }

    // GET /api/actions/mes-stats
    @GetMapping("/mes-stats")
    public ResponseEntity<AssociationStatsDTO> getMyStats(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(actionService.getMyStats(userId));
    }

    // GET /api/actions/mes-brouillons
    @GetMapping("/mes-brouillons")
    public ResponseEntity<List<ActionSummaryDTO>> getMyDrafts(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(actionService.getMyDrafts(userId));
    }

    // ── ADMIN ────────────────────────────────────────────────
    // GET /api/actions/admin/all
    @GetMapping("/admin/all")
    public ResponseEntity<List<ActionSummaryDTO>> getAllForAdmin() {
        return ResponseEntity.ok(actionService.getAllForAdmin());
    }

    @GetMapping("/admin/manage")
    public ResponseEntity<List<ActionSummaryDTO>> getAllNonFixedForAdmin() {
        return ResponseEntity.ok(actionService.getNonFixedForAdmin());
    }

    @PostMapping("/admin/manage")
    public ResponseEntity<ActionDetailDTO> adminCreateNonFixed(
            @Valid @RequestBody AdminActionManageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(actionService.adminCreateNonFixedAction(request));
    }

    @PutMapping("/admin/manage/{id}")
    public ResponseEntity<ActionDetailDTO> adminUpdateNonFixed(
            @PathVariable Long id,
            @Valid @RequestBody AdminActionManageRequest request) {
        return ResponseEntity.ok(actionService.adminUpdateNonFixedAction(id, request));
    }

    @PutMapping("/admin/manage/{id}/activate")
    public ResponseEntity<Void> adminActivateNonFixed(@PathVariable Long id) {
        actionService.adminActivateNonFixedAction(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/manage/{id}/deactivate")
    public ResponseEntity<Void> adminDeactivateNonFixed(@PathVariable Long id) {
        actionService.adminDeactivateNonFixedAction(id);
        return ResponseEntity.noContent().build();
    }

    // ── UPLOAD PHOTO ────────────────────────────────────────
    // POST /api/actions/{id}/photo
    @PostMapping("/{id}/photo")
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("photo") MultipartFile photo,
            @RequestHeader("X-User-Id") Long userId) {
        String photoUrl = actionService.uploadPhoto(id, photo, userId);
        return ResponseEntity.ok(Map.of("photoUrl", photoUrl));
    }

    // ── ENDPOINTS DE TEST KAFKA — à supprimer après ──────────
    // POST /api/actions/test/decrementer/{actionId}
    @PostMapping("/test/decrementer/{actionId}")
    public ResponseEntity<String> testDecrement(@PathVariable Long actionId) {
        actionService.decrementPlace(actionId);
        return ResponseEntity.ok("Place décrémentée — vérifier Kafka UI");
    }

    // POST /api/actions/test/liberer/{actionId}
    @PostMapping("/test/liberer/{actionId}")
    public ResponseEntity<String> testRelease(@PathVariable Long actionId) {
        actionService.releasePlace(actionId);
        return ResponseEntity.ok("Place libérée — vérifier Kafka UI");
    }
}