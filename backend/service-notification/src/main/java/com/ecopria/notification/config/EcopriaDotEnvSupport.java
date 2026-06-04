package com.ecopria.notification.config;

import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

final class EcopriaDotEnvSupport {

    private EcopriaDotEnvSupport() {
    }

    static Path findEnvFile() {
        String explicit = System.getenv("ECOPRIA_ENV_FILE");
        if (StringUtils.hasText(explicit)) {
            Path file = Paths.get(explicit).toAbsolutePath().normalize();
            if (Files.isRegularFile(file)) {
                return file;
            }
        }

        String root = System.getenv("ECOPRIA_ROOT");
        if (StringUtils.hasText(root)) {
            Path file = Paths.get(root).resolve(".env").toAbsolutePath().normalize();
            if (Files.isRegularFile(file)) {
                return file;
            }
        }

        Path dir = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        for (int depth = 0; depth < 8 && dir != null; depth++) {
            Path candidate = dir.resolve(".env");
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
            dir = dir.getParent();
        }
        return null;
    }

    static Map<String, Object> loadMailProperties(Path envFile) {
        Map<String, Object> result = new HashMap<>();
        if (envFile == null) {
            return result;
        }
        try {
            for (String line : Files.readAllLines(envFile)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int eq = trimmed.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = trimmed.substring(0, eq).trim();
                String value = stripQuotes(trimmed.substring(eq + 1).trim());
                if ("EMAIL_PASSWORD".equals(key)) {
                    value = value.replace(" ", "");
                }
                if ("EMAIL_USERNAME".equals(key) && StringUtils.hasText(value)) {
                    result.put("EMAIL_USERNAME", value);
                    result.put("spring.mail.username", value);
                }
                if ("EMAIL_PASSWORD".equals(key) && StringUtils.hasText(value)) {
                    result.put("EMAIL_PASSWORD", value);
                    result.put("spring.mail.password", value);
                }
            }
        } catch (Exception ignored) {
            return Map.of();
        }
        return result;
    }

    private static String stripQuotes(String value) {
        if ((value.startsWith("\"") && value.endsWith("\""))
                || (value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }
}
