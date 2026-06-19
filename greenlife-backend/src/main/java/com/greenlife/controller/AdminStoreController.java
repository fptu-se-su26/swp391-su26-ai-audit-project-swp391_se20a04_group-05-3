package com.greenlife.controller;

import com.greenlife.dto.ApproveStoreRequest;
import com.greenlife.dto.RejectStoreRequest;
import com.greenlife.dto.StoreApprovalAuditResponse;
import com.greenlife.dto.StoreResponse;
import com.greenlife.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/stores")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStoreController {

    private final StoreService storeService;

    @GetMapping("/pending")
    public ResponseEntity<List<StoreResponse>> getPendingStores() {
        return ResponseEntity.ok(storeService.getPendingStores());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<StoreResponse> approveStorePut(
            @PathVariable Integer id,
            @Valid @RequestBody(required = false) ApproveStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.approveStore(id, request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<StoreResponse> approveStorePost(
            @PathVariable Integer id,
            @Valid @RequestBody(required = false) ApproveStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.approveStore(id, request, userDetails.getUsername()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<StoreResponse> rejectStorePut(
            @PathVariable Integer id,
            @Valid @RequestBody RejectStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.rejectStore(id, request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<StoreResponse> rejectStorePost(
            @PathVariable Integer id,
            @Valid @RequestBody RejectStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.rejectStore(id, request, userDetails.getUsername()));
    }

    @GetMapping("/{id}/audit-trail")
    public ResponseEntity<List<StoreApprovalAuditResponse>> getAuditTrail(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.getAuditHistory(id));
    }
}
