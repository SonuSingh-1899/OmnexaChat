package com.example.chat.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.chat.exception.BusinessException;

@Service
public class AvatarStorageService {

    private static final long MAX_AVATAR_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    );

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String storeAvatar(MultipartFile file) {
        validateFile(file);

        Path avatarDirectory = resolveUploadRoot().resolve("avatars");
        String extension = resolveExtension(file.getOriginalFilename(), file.getContentType());
        String filename = UUID.randomUUID() + extension;
        Path targetFile = avatarDirectory.resolve(filename).normalize();

        try {
            Files.createDirectories(avatarDirectory);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new BusinessException("Failed to store avatar image");
        }

        return "/uploads/avatars/" + filename;
    }

    public void deleteIfManaged(String avatarUrl) {
        if (avatarUrl == null || !avatarUrl.startsWith("/uploads/avatars/")) {
            return;
        }

        String filename = avatarUrl.substring("/uploads/avatars/".length());
        if (filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return;
        }

        Path targetFile = resolveUploadRoot().resolve("avatars").resolve(filename).normalize();
        try {
            Files.deleteIfExists(targetFile);
        } catch (IOException ignored) {
            // Best effort cleanup only.
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Please choose an image to upload");
        }

        if (file.getSize() > MAX_AVATAR_SIZE_BYTES) {
            throw new BusinessException("Avatar image must be 5 MB or smaller");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("Only JPG, PNG, WEBP, and GIF images are allowed");
        }
    }

    private Path resolveUploadRoot() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (originalFilename != null) {
            int lastDot = originalFilename.lastIndexOf('.');
            if (lastDot >= 0 && lastDot < originalFilename.length() - 1) {
                String extension = originalFilename.substring(lastDot).toLowerCase();
                if (extension.matches("\\.(jpg|jpeg|png|webp|gif)")) {
                    return extension;
                }
            }
        }

        return switch (contentType == null ? "" : contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
