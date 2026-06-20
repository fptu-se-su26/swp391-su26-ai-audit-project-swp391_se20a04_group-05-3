package com.greenlife.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeDiagnosisImage(MultipartFile file);
    String storeAvatar(MultipartFile file);
    void deleteFile(String relativePath);
}
