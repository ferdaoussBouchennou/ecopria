package com.ecopria.notification.controller;

import com.ecopria.notification.service.PasswordResetEmailService;
import com.ecopria.notification.service.UserAccountStatusEmailService;
import com.ecopria.notification.service.VerificationEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Appels internes (réseau Docker) — pas exposés via l'API Gateway.
 */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalEmailController {

    private final VerificationEmailService verificationEmailService;
    private final PasswordResetEmailService passwordResetEmailService;
    private final UserAccountStatusEmailService userAccountStatusEmailService;

    @PostMapping("/verification-email")
    public ResponseEntity<Void> sendVerificationEmail(@RequestBody Map<String, Object> body) {
        Object emailObj = body.get("email");
        if (emailObj == null || emailObj.toString().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String email = emailObj.toString().trim();
        String code = readString(body, "code");
        String firstName = readStringAny(body, "", "firstName", "first_name");
        verificationEmailService.send(email, code, firstName);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/account-deactivated-email")
    public ResponseEntity<Void> sendAccountDeactivatedEmail(@RequestBody Map<String, Object> body) {
        String email = readEmail(body);
        if (email == null) {
            return ResponseEntity.badRequest().build();
        }
        String raison = readStringAny(body, "", "raison", "reason");
        userAccountStatusEmailService.sendDeactivated(email, raison);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/account-reactivated-email")
    public ResponseEntity<Void> sendAccountReactivatedEmail(@RequestBody Map<String, Object> body) {
        String email = readEmail(body);
        if (email == null) {
            return ResponseEntity.badRequest().build();
        }
        userAccountStatusEmailService.sendReactivated(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/password-reset-email")
    public ResponseEntity<Void> sendPasswordResetEmail(@RequestBody Map<String, Object> body) {
        Object emailObj = body.get("email");
        if (emailObj == null || emailObj.toString().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String code = readString(body, "code");
        passwordResetEmailService.send(emailObj.toString().trim(), code);
        return ResponseEntity.ok().build();
    }

    private static String readEmail(Map<String, Object> body) {
        Object emailObj = body.get("email");
        if (emailObj == null || emailObj.toString().isBlank()) {
            return null;
        }
        return emailObj.toString().trim();
    }

    private static String readString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? "" : value.toString();
    }

    private static String readStringAny(Map<String, Object> body, String fallback, String... keys) {
        for (String key : keys) {
            Object value = body.get(key);
            if (value != null && !value.toString().isBlank()) {
                return value.toString();
            }
        }
        return fallback;
    }
}
