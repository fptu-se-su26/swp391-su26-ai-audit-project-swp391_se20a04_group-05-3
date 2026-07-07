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
}
