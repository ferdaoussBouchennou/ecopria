package com.ecopria.recompense.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
@Slf4j
public class FileController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/partenaires/{filename}")
    public ResponseEntity<Resource> getPartenaireImage(@PathVariable String filename) {
        return serve("partenaires", filename);
    }

    @GetMapping("/recompenses/{filename}")
    public ResponseEntity<Resource> getRecompenseImage(@PathVariable String filename) {
        return serve("recompenses", filename);
    }

    private ResponseEntity<Resource> serve(String folder, String filename) {
        try {
            Path filePath = Paths.get(uploadDir, folder, filename);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "image/jpeg";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".png")) {
                contentType = "image/png";
            } else if (lower.endsWith(".webp")) {
                contentType = "image/webp";
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
        } catch (Exception e) {
            log.error("Erreur lecture fichier {}/{}", folder, filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
