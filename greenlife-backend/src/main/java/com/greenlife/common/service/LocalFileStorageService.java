package com.greenlife.common.service;

import com.greenlife.exception.CustomException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class LocalFileStorageService implements FileStorageService {

    @Value("${greenlife.upload.dir:./uploads}")
    private String uploadBaseDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png");

    private Path baseUploadPath;
    private Path diagnosesPath;
    private Path avatarsPath;
    private Path kycPath;
    private Path returnsPath;
    private Path productsPath;
    private Path storeLogosPath;

    @PostConstruct
    public void init() {
        try {
            this.baseUploadPath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
            this.diagnosesPath = this.baseUploadPath.resolve("diagnoses").normalize();
            this.avatarsPath = this.baseUploadPath.resolve("avatars").normalize();
            this.kycPath = this.baseUploadPath.resolve("kyc").normalize();
            this.returnsPath = this.baseUploadPath.resolve("returns").normalize();
            this.productsPath = this.baseUploadPath.resolve("products").normalize();
            this.storeLogosPath = this.baseUploadPath.resolve("stores/logos").normalize();

            Files.createDirectories(this.baseUploadPath);
            Files.createDirectories(this.diagnosesPath);
            Files.createDirectories(this.avatarsPath);
            Files.createDirectories(this.kycPath);
            Files.createDirectories(this.returnsPath);
            Files.createDirectories(this.productsPath);
            Files.createDirectories(this.storeLogosPath);
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

    @Override
    public String storeReturnEvidence(MultipartFile file) {
        return storeFile(file, returnsPath, "returns", 5 * 1024 * 1024L);
    }

    @Override
    public String storeProductImage(MultipartFile file) {
        return storeFile(file, productsPath, "products", 5 * 1024 * 1024L);
    }

    @Override
    public String storeStoreLogo(MultipartFile file) {
        return storeFile(file, storeLogosPath, "stores/logos", 2 * 1024 * 1024L);
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
    public String storeKycDocument(MultipartFile file) {
        return storeFile(file, kycPath, "kyc", 5 * 1024 * 1024L);
    }

    @Override
    public String storeKycDocument(String base64Content) {
        if (base64Content == null || base64Content.trim().isEmpty()) {
            throw new CustomException("Tài liệu KYC không được để trống", HttpStatus.BAD_REQUEST);
        }

        String input = base64Content.trim();

        // 1. If input is a valid internal KYC storage key starting with /uploads/kyc/, return as-is without Base64 decoding
        if (input.startsWith("/uploads/kyc/") || input.startsWith("uploads/kyc/")) {
            String key = input.startsWith("/") ? input : "/" + input;
            if (key.contains("..") || key.contains("\\") || key.contains("%2e%2e") || key.contains("?") || key.contains("#")) {
                throw new CustomException("Đường dẫn tài liệu không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            String lower = key.toLowerCase();
            if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
                throw new CustomException("Định dạng tệp tài liệu không được hỗ trợ", HttpStatus.BAD_REQUEST);
            }
            return key;
        }

        // Reject blob:, file:, http://, https:// or non-KYC /uploads/ paths
        if (input.startsWith("blob:") || input.startsWith("file:") || input.startsWith("http://") || input.startsWith("https://")
                || input.startsWith("/uploads/") || input.startsWith("uploads/")) {
            throw new CustomException("Không thể xử lý tài liệu xác minh. Vui lòng tải lại ảnh và thử lại.", HttpStatus.BAD_REQUEST);
        }

        String base64Data = input;
        if (base64Data.startsWith("data:")) {
            int commaIndex = base64Data.indexOf(',');
            if (commaIndex == -1) {
                throw new CustomException("Định dạng Data URI không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            String header = base64Data.substring(0, commaIndex);
            if (!header.contains(";base64")) {
                throw new CustomException("Định dạng Data URI không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            base64Data = base64Data.substring(commaIndex + 1);
        }

        // 2. Decode Base64
        byte[] decodedBytes;
        try {
            decodedBytes = Base64.getDecoder().decode(base64Data);
        } catch (IllegalArgumentException e) {
            throw new CustomException("Nội dung Base64 không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        // 3. Reject payloads larger than 5MB after decoding
        long maxSize = 5 * 1024 * 1024L; // 5MB
        if (decodedBytes.length > maxSize) {
            throw new CustomException("Kích thước ảnh vượt quá giới hạn 5MB", HttpStatus.BAD_REQUEST);
        }

        // 4. Validate magic bytes before ImageIO.read()
        // Allow ONLY JPEG, PNG. Reject SVG, GIF, BMP, TIFF, WEBP etc.
        boolean isJpg = decodedBytes.length >= 2 && 
                        (decodedBytes[0] & 0xFF) == 0xFF && 
                        (decodedBytes[1] & 0xFF) == 0xD8;
        boolean isPng = decodedBytes.length >= 4 && 
                        (decodedBytes[0] & 0xFF) == 0x89 && 
                        (decodedBytes[1] & 0xFF) == 0x50 && 
                        (decodedBytes[2] & 0xFF) == 0x4E && 
                        (decodedBytes[3] & 0xFF) == 0x47;

        if (!isJpg && !isPng) {
            throw new CustomException("Định dạng tệp không được hỗ trợ. Chỉ cho phép ảnh JPEG, PNG.", HttpStatus.BAD_REQUEST);
        }

        String ext = isPng ? "png" : "jpg";

        // 5. Validate image binary using ImageIO.read() to prevent spoofing
        try (ByteArrayInputStream bais = new ByteArrayInputStream(decodedBytes)) {
            if (ImageIO.read(bais) == null) {
                throw new CustomException("Nội dung ảnh bị lỗi hoặc không hợp lệ", HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            if (e instanceof CustomException) {
                throw (CustomException) e;
            }
            throw new CustomException("Nội dung ảnh bị lỗi hoặc không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        // 6. Generate UUID filename (never use client-supplied filename)
        String newFilename = UUID.randomUUID().toString() + "." + ext;
        Path targetLocation = kycPath.resolve(newFilename);

        try {
            Files.createDirectories(kycPath);
            Files.write(targetLocation, decodedBytes);
        } catch (IOException e) {
            throw new CustomException("Không thể ghi tệp KYC lên đĩa: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Return relative path
        return "/uploads/kyc/" + newFilename;
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
            log.warn("Could not delete file: {}. Error: {}", relativePath, e.getMessage());
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
