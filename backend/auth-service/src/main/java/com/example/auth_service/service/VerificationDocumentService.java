package com.example.auth_service.service;

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
public class VerificationDocumentService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final long MAX_BYTES = 5 * 1024 * 1024;

    private final Path uploadDir;

    public VerificationDocumentService(
            @Value("${app.verification-upload-dir:uploads/verification}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document file is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must be 5 MB or smaller");
        }

        String extension = resolveExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Allowed formats: PDF, JPG, PNG");
        }

        try {
            Files.createDirectories(uploadDir);
            String storedName = UUID.randomUUID() + "_" + sanitizeBaseName(file.getOriginalFilename()) + "." + extension;
            Path target = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/api/auth/verification-documents/" + storedName;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store document");
        }
    }

    public Path resolveStoredFile(String filename) {
        if (!StringUtils.hasText(filename) || filename.contains("..") || filename.contains("/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid filename");
        }
        Path file = uploadDir.resolve(filename).normalize();
        if (!file.startsWith(uploadDir) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found");
        }
        return file;
    }

    private String resolveExtension(String originalFilename) {
        String ext = StringUtils.getFilenameExtension(originalFilename);
        if (!StringUtils.hasText(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must have an extension");
        }
        return ext.toLowerCase(Locale.ROOT);
    }

    private String sanitizeBaseName(String originalFilename) {
        String base = StringUtils.stripFilenameExtension(originalFilename);
        if (!StringUtils.hasText(base)) {
            return "document";
        }
        return base.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
