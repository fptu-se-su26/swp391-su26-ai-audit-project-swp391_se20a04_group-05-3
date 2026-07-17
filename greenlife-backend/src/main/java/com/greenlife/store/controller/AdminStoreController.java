package com.greenlife.store.controller;

import com.greenlife.store.dto.ApproveStoreRequest;
import com.greenlife.store.dto.RejectStoreRequest;
import com.greenlife.store.dto.StoreApprovalAuditResponse;
import com.greenlife.store.dto.StoreResponse;
import com.greenlife.store.service.StoreService;
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

    @GetMapping("/approved")
    public ResponseEntity<List<StoreResponse>> getApprovedStores() {
        return ResponseEntity.ok(storeService.getApprovedStores());
    }

    /**
     * Approve a pending store (RESTful PUT for state transition).
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<StoreResponse> approveStore(
            @PathVariable Integer id,
            @Valid @RequestBody(required = false) ApproveStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(storeService.approveStore(id, request, userDetails.getUsername()));
    }

    /**
     * Reject a pending store (RESTful PUT for state transition).
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<StoreResponse> rejectStore(
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
