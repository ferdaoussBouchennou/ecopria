package com.ecopria.recompense.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class ImageUploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:}")
    private String baseUrl;

    public String storePartenaireCover(MultipartFile file, Long userId) {
        return store(file, "partenaires", "cover_" + userId);
    }

    public String storePartenaireGallery(MultipartFile file, Long userId) {
        return store(file, "partenaires", "gallery_" + userId);
    }

    public String storeOffreImage(MultipartFile file, Long offreId) {
        return store(file, "recompenses", "offre_" + offreId);
    }

    private String store(MultipartFile file, String subfolder, String prefix) {
        validateImage(file);
        try {
            Path uploadPath = Paths.get(uploadDir, subfolder);
            Files.createDirectories(uploadPath);

            String extension = extensionFrom(file);
            String filename = prefix + "_" + UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String path = "/uploads/" + subfolder + "/" + filename;
            String url = baseUrl != null && !baseUrl.isBlank()
                    ? baseUrl.replaceAll("/$", "") + path
                    : path;
            log.info("Image enregistrée: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Erreur upload image", e);
            throw new RuntimeException("Erreur lors de l'upload de l'image: " + e.getMessage());
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Le fichier image est vide");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Le fichier doit être une image (JPG, PNG ou WEBP)");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("L'image ne peut pas dépasser 5 Mo");
        }
    }

    private String extensionFrom(MultipartFile file) {
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            String ext = original.substring(original.lastIndexOf('.')).toLowerCase();
            if (ext.matches("\\.(jpg|jpeg|png|webp)")) {
                return ext;
            }
        }
        String ct = file.getContentType();
        if (ct != null) {
            if (ct.contains("png")) return ".png";
            if (ct.contains("webp")) return ".webp";
        }
        return ".jpg";
    }
}
