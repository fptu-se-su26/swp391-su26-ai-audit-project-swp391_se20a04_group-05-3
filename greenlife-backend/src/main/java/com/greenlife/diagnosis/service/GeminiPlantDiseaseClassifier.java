package com.greenlife.diagnosis.service;

import com.greenlife.diagnosis.dto.DiagnosisResult;
import com.greenlife.ai.service.GeminiProviderService;
import com.greenlife.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GeminiPlantDiseaseClassifier implements PlantDiseaseClassifier {

    private final GeminiProviderService geminiProviderService;

    @Override
    public DiagnosisResult classify(String originalFilename, byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new CustomException("Tệp tin trống", HttpStatus.BAD_REQUEST);
        }

        String detectedMime = detectMimeType(fileBytes);
        if (detectedMime == null) {
            throw new CustomException("Định dạng tệp tin không được hỗ trợ", HttpStatus.BAD_REQUEST);
        }

        String filenameExt = getFileExtension(originalFilename);
        if (filenameExt == null || !isExtensionConsistentWithMime(filenameExt, detectedMime)) {
            throw new CustomException("Phần mở rộng tệp tin không khớp với nội dung hình ảnh thực tế", HttpStatus.BAD_REQUEST);
        }

        return geminiProviderService.classifyImage(fileBytes, detectedMime);
    }

    private String detectMimeType(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return null;
        }
        // JPEG Magic Bytes: FF D8 FF
        if (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF) {
            return "image/jpeg";
        }
        // PNG Magic Bytes: 89 50 4E 47
        if (bytes[0] == (byte) 0x89 && bytes[1] == (byte) 0x50 && bytes[2] == (byte) 0x4E && bytes[3] == (byte) 0x47) {
            return "image/png";
        }
        // WebP Magic Bytes: RIFF .... WEBP
        if (bytes.length >= 12 &&
            bytes[0] == (byte) 0x52 && bytes[1] == (byte) 0x49 && bytes[2] == (byte) 0x46 && bytes[3] == (byte) 0x46 && // RIFF
            bytes[8] == (byte) 0x57 && bytes[9] == (byte) 0x45 && bytes[10] == (byte) 0x42 && bytes[11] == (byte) 0x50) { // WEBP
            return "image/webp";
        }
        return null;
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return null;
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private boolean isExtensionConsistentWithMime(String ext, String mime) {
        if ("image/jpeg".equals(mime)) {
            return "jpg".equals(ext) || "jpeg".equals(ext);
        }
        if ("image/png".equals(mime)) {
            return "png".equals(ext);
        }
        if ("image/webp".equals(mime)) {
            return "webp".equals(ext);
        }
        return false;
    }
}
