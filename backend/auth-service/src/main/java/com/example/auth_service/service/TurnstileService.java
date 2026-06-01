package com.example.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurnstileService {

    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final RestTemplate restTemplate;

    @Value("${turnstile.secret-key:}")
    private String secretKey;

    @Value("${turnstile.enabled:true}")
    private boolean enabled;

    @Value("${turnstile.dev-bypass-enabled:false}")
    private boolean devBypassEnabled;

    private static final String DEV_BYPASS_TOKEN = "ecopria-dev-captcha-bypass";

    public void verifyToken(String captchaToken) {
        if (!enabled) {
            return;
        }
        if (!StringUtils.hasText(captchaToken)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Captcha requis");
        }
        if (devBypassEnabled && DEV_BYPASS_TOKEN.equals(captchaToken.trim())) {
            log.warn("Captcha contourné (mode développement uniquement)");
            return;
        }
        if (!StringUtils.hasText(secretKey)) {
            log.warn("Turnstile activé mais turnstile.secret-key manquant — captcha ignoré");
            return;
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("secret", secretKey.trim());
        body.add("response", captchaToken.trim());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    VERIFY_URL,
                    entity,
                    Map.class
            );
            if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
                log.warn("Turnstile rejeté : {}", response);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Captcha invalide ou expiré");
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Erreur vérification Turnstile", ex);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Impossible de valider le captcha");
        }
    }
}
