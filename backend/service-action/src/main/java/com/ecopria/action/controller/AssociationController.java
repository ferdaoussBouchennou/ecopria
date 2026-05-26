package com.ecopria.action.controller;

import com.ecopria.action.dto.*;
import com.ecopria.action.service.ActionService;
import com.ecopria.action.service.AssociationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/associations")
@RequiredArgsConstructor
public class AssociationController {

    private final AssociationService associationService;
    private final ActionService actionService;


    // ── ACTIONS PUBLIQUES D'UNE ASSOCIATION ──────────────────
    // GET /api/associations/{id}/actions
    @GetMapping("/{id}/actions")
    public ResponseEntity<List<ActionSummaryDTO>> getAssociationActions(@PathVariable Long id) {
        return ResponseEntity.ok(actionService.getPublishedActionsByAssociationId(id));
    }
}