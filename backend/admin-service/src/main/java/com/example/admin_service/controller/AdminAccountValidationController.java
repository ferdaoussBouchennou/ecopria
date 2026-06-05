package com.example.admin_service.controller;

import com.example.admin_service.dto.response.OrganizationAccountsPageResponse;
import com.example.admin_service.service.AdminAccountValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/accounts")
@RequiredArgsConstructor
public class AdminAccountValidationController {

    private final AdminAccountValidationService accountValidationService;

    @GetMapping("/validations")
    public ResponseEntity<OrganizationAccountsPageResponse> getValidations(
            @RequestParam(defaultValue = "pending") String filter) {
        return ResponseEntity.ok(accountValidationService.getAccounts(filter));
    }

    @GetMapping("/{userId}/document")
    public ResponseEntity<byte[]> getVerificationDocument(@PathVariable Long userId) {
        return accountValidationService.getVerificationDocument(userId);
    }
}