package com.ecopria.notification.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Charge {@code .env} avant la configuration Spring Mail (Maven / IDE).
 */
public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envFile = EcopriaDotEnvSupport.findEnvFile();
        Map<String, Object> fromFile = EcopriaDotEnvSupport.loadMailProperties(envFile);

        Map<String, Object> overrides = new HashMap<>();
        mergeIfBlank(environment, overrides, fromFile, "spring.mail.username", "EMAIL_USERNAME");
        mergeIfBlank(environment, overrides, fromFile, "spring.mail.password", "EMAIL_PASSWORD");
        sanitizePassword(environment, overrides);

        if (!overrides.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("ecopriaDotEnv", overrides));
            System.setProperty("ecopria.env.loaded", "true");
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private static void mergeIfBlank(
            ConfigurableEnvironment env,
            Map<String, Object> overrides,
            Map<String, Object> fromFile,
            String springKey,
            String envKey) {
        if (StringUtils.hasText(env.getProperty(springKey))) {
            return;
        }
        Object value = fromFile.get(springKey);
        if (value == null) {
            value = fromFile.get(envKey);
        }
        if (value == null && StringUtils.hasText(System.getenv(envKey))) {
            value = System.getenv(envKey);
        }
        if (value != null && StringUtils.hasText(value.toString())) {
            String trimmed = value.toString().trim();
            overrides.put(springKey, trimmed);
            overrides.put(envKey, trimmed);
        }
    }

    private static void sanitizePassword(ConfigurableEnvironment env, Map<String, Object> overrides) {
        String pass = firstNonBlank(
                overrides.get("spring.mail.password"),
                env.getProperty("spring.mail.password"),
                env.getProperty("EMAIL_PASSWORD"),
                System.getenv("EMAIL_PASSWORD")
        );
        if (!StringUtils.hasText(pass)) {
            return;
        }
        String normalized = pass.replace(" ", "");
        overrides.put("spring.mail.password", normalized);
        overrides.put("EMAIL_PASSWORD", normalized);
    }

    private static String firstNonBlank(Object... candidates) {
        for (Object candidate : candidates) {
            if (candidate == null) {
                continue;
            }
            String value = candidate.toString().trim();
            if (!value.isEmpty()) {
                return value;
            }
        }
        return null;
    }
}
