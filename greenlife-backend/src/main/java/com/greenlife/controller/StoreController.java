package com.greenlife.controller;

import com.greenlife.dto.StoreRequest;
import com.greenlife.dto.StoreResponse;
import com.greenlife.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @PostMapping("/register")
    public ResponseEntity<StoreResponse> registerStore(
            @Valid @RequestBody StoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.createStore(request, userDetails.getUsername()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<StoreResponse>> getMyStores(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.getStoresByOwner(userDetails.getUsername()));
    }
}
