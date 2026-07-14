package com.greenlife.booking.controller;

import com.greenlife.booking.dto.PlantCareServiceRequest;
import com.greenlife.booking.dto.PlantCareServiceResponse;
import com.greenlife.booking.dto.ServiceStatusUpdateRequest;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.booking.service.PlantCareServiceManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/store-owner/services")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STORE_OWNER')")
public class StoreOwnerPlantCareServiceController {

    private final PlantCareServiceManager serviceManager;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    public ResponseEntity<Page<PlantCareServiceResponse>> getMyStoreServices(
            @RequestParam(required = false) Integer storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(serviceManager.listStoreServices(user.getId(), storeId, page, size));
    }

    @PostMapping
    public ResponseEntity<PlantCareServiceResponse> createService(
            @Valid @RequestBody PlantCareServiceRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        PlantCareServiceResponse created = serviceManager.createService(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlantCareServiceResponse> updateService(
            @PathVariable Integer id,
            @Valid @RequestBody PlantCareServiceRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(serviceManager.updateService(user.getId(), id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PlantCareServiceResponse> updateServiceStatus(
            @PathVariable Integer id,
            @Valid @RequestBody ServiceStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(serviceManager.updateServiceStatus(user.getId(), id, request.getStatus()));
    }
}
