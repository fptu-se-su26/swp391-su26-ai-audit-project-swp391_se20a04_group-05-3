package com.greenlife.service;

import com.greenlife.exception.CustomException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    @Value("${greenlife.upload.dir:./uploads}")
    private String uploadBaseDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");

    private Path baseUploadPath;
    private Path diagnosesPath;
    private Path avatarsPath;

    @PostConstruct
    public void init() {
        try {
            this.baseUploadPath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
            this.diagnosesPath = this.baseUploadPath.resolve("diagnoses").normalize();
            this.avatarsPath = this.baseUploadPath.resolve("avatars").normalize();

            Files.createDirectories(this.baseUploadPath);
            Files.createDirectories(this.diagnosesPath);
            Files.createDirectories(this.avatarsPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize file storage directories", e);
        }
    }

    @Override
    public String storeDiagnosisImage(MultipartFile file) {
        return storeFile(file, diagnosesPath, "diagnoses", 5 * 1024 * 1024L);
    }

    @Override
    public String storeAvatar(MultipartFile file) {
        return storeFile(file, avatarsPath, "avatars", 2 * 1024 * 1024L);
    }

    private String storeFile(MultipartFile file, Path targetDir, String subfolder, long maxSize) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("File is empty", HttpStatus.BAD_REQUEST);
        }

        // Validate size
        if (file.getSize() > maxSize) {
            throw new CustomException("File size exceeds limit", HttpStatus.BAD_REQUEST);
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new CustomException("MIME type is not allowed", HttpStatus.BAD_REQUEST);
        }

        // Validate extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new CustomException("Invalid filename", HttpStatus.BAD_REQUEST);
        }
        
        String ext = getFileExtension(originalFilename);
        if (ext == null || !ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new CustomException("File extension is not allowed", HttpStatus.BAD_REQUEST);
        }

        // Validate image binary using ImageIO to prevent spoofing
        try (InputStream is = file.getInputStream()) {
            if (ImageIO.read(is) == null) {
                throw new CustomException("Malformed image content", HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            throw new CustomException("Malformed or corrupt image content", HttpStatus.BAD_REQUEST);
        }

        // Generate UUID filename
        String newFilename = UUID.randomUUID().toString() + "." + ext.toLowerCase();
        Path targetLocation = targetDir.resolve(newFilename);

        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new CustomException("Failed to store file on disk: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Return relative web URL
        return "/uploads/" + subfolder + "/" + newFilename;
    }

    @Override
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.trim().isEmpty()) {
            return;
        }

        // Normalize and extract subpath
        String cleanPath = relativePath.trim();
        if (cleanPath.startsWith("/uploads/")) {
            cleanPath = cleanPath.substring("/uploads/".length());
        } else if (cleanPath.startsWith("uploads/")) {
            cleanPath = cleanPath.substring("uploads/".length());
        } else {
            return; // Not a managed path
        }

        try {
            Path fileToDelete = this.baseUploadPath.resolve(cleanPath).normalize();
            // Security constraint: Prevent directory traversal outside baseUploadPath
            if (fileToDelete.startsWith(this.baseUploadPath)) {
                Files.deleteIfExists(fileToDelete);
            }
        } catch (IOException e) {
            // Log warning but do not throw exception to prevent interrupting operations
            System.err.println("Could not delete file: " + relativePath + ". Error: " + e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1 || lastIndex == filename.length() - 1) {
            return null;
        }
        return filename.substring(lastIndex + 1);
    }
}
