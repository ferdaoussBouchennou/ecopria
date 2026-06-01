package com.ecopria.notification.controller;

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
