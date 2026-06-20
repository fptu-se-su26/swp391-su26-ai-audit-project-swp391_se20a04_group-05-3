package com.greenlife.controller;

import com.greenlife.dto.StoreRequest;
import com.greenlife.dto.StoreResponse;
import com.greenlife.service.StoreService;
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
@PreAuthorize("hasRole('STORE_OWNER')")
public class StoreProfileController {

    private final StoreService storeService;

    @PostMapping
    public ResponseEntity<StoreResponse> createStore(
            @Valid @RequestBody StoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.createStore(request, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<StoreResponse> getStore(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.getStoreProfile(userDetails.getUsername()));
    }

    @PutMapping
    public ResponseEntity<StoreResponse> updateStore(
            @Valid @RequestBody StoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.updateStoreProfile(request, userDetails.getUsername()));
    }
}
