package com.greenlife.store.controller;

import com.greenlife.store.dto.StoreRequest;
import com.greenlife.store.dto.StoreResponse;
import com.greenlife.store.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/store/profile")
@RequiredArgsConstructor
public class StoreProfileController {

    private final StoreService storeService;
    private final com.greenlife.common.service.FileStorageService fileStorageService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<StoreResponse> createStore(
            @Valid @RequestBody StoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.createStore(request, userDetails.getUsername()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<StoreResponse> getStore(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.getStoreProfile(userDetails.getUsername()));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<StoreResponse> updateStore(
            @Valid @RequestBody StoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.updateStoreProfile(request, userDetails.getUsername()));
    }

    @PostMapping("/logo/upload")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<java.util.Map<String, String>> uploadLogo(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        String url = fileStorageService.storeStoreLogo(file);
        return ResponseEntity.ok(java.util.Map.of("url", url));
    }

    @PostMapping("/kyc/upload")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<java.util.Map<String, String>> uploadKycDocument(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        String url = fileStorageService.storeKycDocument(file);
        return ResponseEntity.ok(java.util.Map.of("url", url));
    }
}
