package com.ecopria.utilisateur.controller;

import com.ecopria.utilisateur.dto.AssociationAdminUpsertRequest;
import com.ecopria.utilisateur.model.Association;
import com.ecopria.utilisateur.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/associations")
@RequiredArgsConstructor
public class InternalAssociationController {

    private final UserService userService;

    @GetMapping("/{authId}")
    public ResponseEntity<Association> getByAuthId(@PathVariable Long authId) {
        return ResponseEntity.ok(userService.getAssociation(authId));
    }

    @PostMapping
    public ResponseEntity<Association> upsert(@RequestBody AssociationAdminUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.adminUpsertAssociation(request));
    }

    @PutMapping("/{authId}")
    public ResponseEntity<Association> update(
            @PathVariable Long authId,
            @RequestBody AssociationAdminUpsertRequest request) {
        request.setAuthId(authId);
        return ResponseEntity.ok(userService.adminUpsertAssociation(request));
    }
}
