package com.greenlife.store.controller;

import com.greenlife.exception.CustomException;
import com.greenlife.store.entity.Store;
import com.greenlife.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
public class KycDocumentAccessController {

    private final StoreRepository storeRepository;

    @Value("${greenlife.upload.dir:./uploads}")
    private String uploadBaseDir;

    @GetMapping("/files/{filename:.+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_OWNER')")
    public ResponseEntity<Resource> downloadKycDocument(
            @PathVariable String filename,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new CustomException("Tên tệp không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        String username = userDetails.getUsername();
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            List<Store> stores = storeRepository.findByOwnerEmail(username);
            boolean isOwnerFile = stores.stream().anyMatch(s -> 
                (s.getCccdFrontUrl() != null && s.getCccdFrontUrl().contains(filename)) ||
                (s.getCccdBackUrl() != null && s.getCccdBackUrl().contains(filename)) ||
                (s.getVerificationDocument() != null && s.getVerificationDocument().contains(filename)) ||
                (s.getBusinessEvidenceUrls() != null && s.getBusinessEvidenceUrls().contains(filename))
            );
            if (!isOwnerFile) {
                throw new CustomException("Bạn không có quyền truy cập tệp tài liệu này", HttpStatus.FORBIDDEN);
            }
        }

        try {
            Path kycDir = Paths.get(uploadBaseDir).toAbsolutePath().normalize().resolve("kyc");
            Path filePath = kycDir.resolve(filename).normalize();

            if (!filePath.startsWith(kycDir) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
                throw new CustomException("Tài liệu không tồn tại", HttpStatus.NOT_FOUND);
            }

            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (CustomException ce) {
            throw ce;
        } catch (Exception e) {
            throw new CustomException("Không thể tải tài liệu", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
