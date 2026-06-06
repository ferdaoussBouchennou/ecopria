package com.example.auth_service.validation;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

public final class PasswordPolicy {

    private static final Pattern STRONG_PASSWORD = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,255}$"
    );

    private PasswordPolicy() {
    }

    public static void requireStrong(String password) {
        if (!StringUtils.hasText(password) || !STRONG_PASSWORD.matcher(password.trim()).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Le mot de passe doit contenir au moins 8 caractères, une majuscule, "
                            + "une minuscule, un chiffre et un caractère spécial.");
        }
    }
}
