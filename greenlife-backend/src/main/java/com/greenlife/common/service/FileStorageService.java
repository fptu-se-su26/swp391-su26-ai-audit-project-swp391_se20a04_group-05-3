package com.greenlife.common.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeDiagnosisImage(MultipartFile file);
    String storeAvatar(MultipartFile file);
    String storeKycDocument(String base64Content);
    String storeReturnEvidence(MultipartFile file);
    String storeProductImage(MultipartFile file);
    String storeStoreLogo(MultipartFile file);
    void deleteFile(String relativePath);
}
