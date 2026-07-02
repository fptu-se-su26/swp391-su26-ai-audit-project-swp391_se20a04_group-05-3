package com.greenlife.common.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeDiagnosisImage(MultipartFile file);
    String storeAvatar(MultipartFile file);
    String storeKycDocument(String base64Content);
    void deleteFile(String relativePath);
}
