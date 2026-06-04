package com.ecopria.notification.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Complète {@link DotEnvEnvironmentPostProcessor} au démarrage du contexte.
 */
@Slf4j
public class LocalDotEnvLoader implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext context) {
        ConfigurableEnvironment environment = context.getEnvironment();
        if ("true".equals(environment.getProperty("ecopria.env.loaded"))) {
            logMailStatus(environment);
            return;
        }

        Path envFile = EcopriaDotEnvSupport.findEnvFile();
        Map<String, Object> fromFile = EcopriaDotEnvSupport.loadMailProperties(envFile);
        if (!fromFile.isEmpty()) {
            Map<String, Object> overrides = new HashMap<>(fromFile);
            environment.getPropertySources().addFirst(new MapPropertySource("ecopriaDotEnvContext", overrides));
            environment.getSystemProperties().put("ecopria.env.loaded", "true");
        }
        logMailStatus(environment);
    }

    private static void logMailStatus(ConfigurableEnvironment environment) {
        Path envFile = EcopriaDotEnvSupport.findEnvFile();
        String username = firstNonBlank(
                environment.getProperty("spring.mail.username"),
                environment.getProperty("EMAIL_USERNAME")
        );
        if (StringUtils.hasText(username)) {
            log.info("[mail] SMTP prêt — expéditeur : {} (.env : {})",
                    username,
                    envFile != null ? envFile.toAbsolutePath() : "variables d'environnement");
        } else {
            log.error("[mail] EMAIL_USERNAME vide — les e-mails (bannissement, vérification, etc.) échoueront. "
                    + "Placez .env à la racine du projet (ecopria/.env) ou définissez ECOPRIA_ROOT.");
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }
}
