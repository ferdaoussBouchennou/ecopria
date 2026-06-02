package com.example.auth_service.controller;

import com.example.auth_service.dto.*;
import com.example.auth_service.service.AuthService;
import com.example.auth_service.service.PasswordResetService;
import com.example.auth_service.service.VerificationDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final VerificationDocumentService verificationDocumentService;

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request);
        return ResponseEntity.ok(Map.of(
                "message", "Un nouveau code a été envoyé à votre adresse e-mail."));
    }

    @PostMapping("/register/document")
    public ResponseEntity<Map<String, String>> uploadVerificationDocument(
            @RequestParam("file") MultipartFile file) {
        String documentPath = verificationDocumentService.store(file);
        return ResponseEntity.ok(Map.of("document", documentPath));
    }

    @GetMapping("/verification-documents/{filename}")
    public ResponseEntity<Resource> getVerificationDocument(@PathVariable String filename) {
        try {
            Path file = verificationDocumentService.resolveStoredFile(filename);
            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "Si un compte existe avec cet e-mail, un code de réinitialisation a été envoyé."));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<ResetSessionResponse> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        String resetToken = passwordResetService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ResetSessionResponse.builder()
                .resetToken(resetToken)
                .message("Code validé. Choisissez un nouveau mot de passe.")
                .build());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getResetToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour. Vous pouvez vous connecter."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestParam String token) {
        return ResponseEntity.ok(authService.refresh(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestParam String token) {
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/verification-response")
    public ResponseEntity<Void> handleAdminVerificationResponse(@Valid @RequestBody AdminVerificationDecisionRequest request) {
        authService.handleAdminVerificationResponse(request);
        return ResponseEntity.noContent().build();
    }
}