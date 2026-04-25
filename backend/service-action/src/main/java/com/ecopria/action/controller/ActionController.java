package com.ecopria.action.controller;

import com.ecopria.action.dto.*;
import com.ecopria.action.service.ActionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
    public ResponseEntity<ActionDetailDTO> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(actionService.getDetail(id));
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
}