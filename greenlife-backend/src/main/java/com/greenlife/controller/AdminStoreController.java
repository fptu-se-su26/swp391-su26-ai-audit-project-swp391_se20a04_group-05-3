package com.greenlife.controller;

import com.greenlife.dto.StoreResponse;
import com.greenlife.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/stores")
@RequiredArgsConstructor
public class AdminStoreController {

    private final StoreService storeService;

    @GetMapping("/pending")
    public ResponseEntity<List<StoreResponse>> getPendingStores() {
        return ResponseEntity.ok(storeService.getPendingStores());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<StoreResponse> approveStorePut(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.approveStore(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<StoreResponse> approveStorePost(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.approveStore(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<StoreResponse> rejectStorePut(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.rejectStore(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<StoreResponse> rejectStorePost(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.rejectStore(id));
    }
}
