package com.ecopria.utilisateur.controller;

import com.ecopria.utilisateur.model.Association;
import com.ecopria.utilisateur.model.Citizen;
import com.ecopria.utilisateur.model.Partner;
import com.ecopria.utilisateur.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/internal/admin/accounts")
@RequiredArgsConstructor
public class InternalAdminAccountsController {

    private final UserService userService;

    @GetMapping("/citizens")
    public ResponseEntity<List<Citizen>> listCitizens() {
        return ResponseEntity.ok(userService.listAllCitizens());
    }

    @GetMapping("/associations")
    public ResponseEntity<List<Association>> listAssociations() {
        return ResponseEntity.ok(userService.listAllAssociations());
    }

    @GetMapping("/partners")
    public ResponseEntity<List<Partner>> listPartners() {
        return ResponseEntity.ok(userService.listAllPartners());
    }

    @GetMapping("/citizens/{authId}")
    public ResponseEntity<Citizen> getCitizenByAuthId(@PathVariable Long authId) {
        return ResponseEntity.ok(userService.getCitizen(authId));
    }
}
