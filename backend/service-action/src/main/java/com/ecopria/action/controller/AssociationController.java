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
@CrossOrigin(origins = "*")
public class AssociationController {

    private final AssociationService associationService;
    private final ActionService actionService;

    /** Catalogue public des associations validées. */
    @GetMapping("/public")
    public ResponseEntity<List<AssociationPublicDTO>> getPublicAssociations() {
        return ResponseEntity.ok(associationService.listPublic());
    }

    /** Profil public d'une association par authId (userId). */
    @GetMapping("/public/{userId}")
    public ResponseEntity<AssociationPublicDTO> getPublicAssociation(@PathVariable Long userId) {
        return ResponseEntity.ok(associationService.getPublicByUserId(userId));
    }

    /** Actions publiées d'une association (id interne db_action). */
    @GetMapping("/{id}/actions")
    public ResponseEntity<List<ActionSummaryDTO>> getAssociationActions(@PathVariable Long id) {
        return ResponseEntity.ok(actionService.getPublishedActionsByAssociationId(id));
    }

    /** Actions publiées par authId du compte association. */
    @GetMapping("/user/{userId}/actions")
    public ResponseEntity<List<ActionSummaryDTO>> getAssociationActionsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(actionService.getPublishedActionsByAssociationUserId(userId));
    }
}
