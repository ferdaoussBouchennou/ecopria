package com.example.admin_service.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;

import java.util.Map;

@RestControllerAdvice
public class AdminExceptionHandler {

    @ExceptionHandler(HttpStatusCodeException.class)
    public ResponseEntity<Map<String, String>> handleHttpStatus(HttpStatusCodeException ex) {
        String body = ex.getResponseBodyAsString();
        String message = extractMessage(body);
        if (message == null || message.isBlank()) {
            message = "Erreur service-action (HTTP " + ex.getStatusCode().value() + ")";
        }
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("message", message));
    }

    private String extractMessage(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        int marker = body.indexOf("\"message\"");
        if (marker >= 0) {
            int start = body.indexOf(':', marker) + 1;
            int firstQuote = body.indexOf('"', start);
            int secondQuote = body.indexOf('"', firstQuote + 1);
            if (firstQuote >= 0 && secondQuote > firstQuote) {
                return body.substring(firstQuote + 1, secondQuote);
            }
        }
        return body.length() > 240 ? body.substring(0, 240) : body;
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, String>> handleConnection(ResourceAccessException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("message",
                        "service-action injoignable. Démarrez-le sur le port 9090 (profil local)."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage() != null ? ex.getMessage() : "Erreur"));
    }
}
