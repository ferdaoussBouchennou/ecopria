package com.example.admin_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CategoryImageStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final long MAX_BYTES = 5 * 1024 * 1024;

    private final Path uploadDir;

    public CategoryImageStorageService(
            @Value("${app.category-upload-dir:uploads/categories}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Veuillez sélectionner une image.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'image doit faire 5 Mo maximum.");
        }

        String extension = resolveExtension(file.getOriginalFilename(), file.getContentType());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formats acceptés : JPG, PNG, WEBP.");
        }

        try {
            Files.createDirectories(uploadDir);
            String storedName = UUID.randomUUID() + "." + extension;
            Path target = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/admin/category-images/" + storedName;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible d'enregistrer l'image.");
        }
    }

    public Path resolveStoredFile(String filename) {
        if (!StringUtils.hasText(filename) || filename.contains("..") || filename.contains("/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nom de fichier invalide.");
        }
        Path file = uploadDir.resolve(filename).normalize();
        if (!file.startsWith(uploadDir) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image introuvable.");
        }
        return file;
    }

    private String resolveExtension(String originalFilename, String contentType) {
        String ext = StringUtils.getFilenameExtension(originalFilename);
        if (StringUtils.hasText(ext)) {
            ext = ext.toLowerCase(Locale.ROOT);
            if ("jpeg".equals(ext)) {
                return "jpg";
            }
            if (ALLOWED_EXTENSIONS.contains(ext)) {
                return ext;
            }
        }
        if (contentType != null) {
            return switch (contentType.toLowerCase(Locale.ROOT)) {
                case "image/jpeg", "image/jpg" -> "jpg";
                case "image/png" -> "png";
                case "image/webp" -> "webp";
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format d'image non reconnu.");
            };
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier doit avoir une extension valide.");
    }
}
