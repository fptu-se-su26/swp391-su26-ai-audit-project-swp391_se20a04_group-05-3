package com.greenlife.plant.controller;

import com.greenlife.plant.dto.StoreOwnerPlantRequest;
import com.greenlife.plant.dto.PlantResponse;
import com.greenlife.plant.service.PlantService;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store-owner/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STORE_OWNER')")
public class StoreOwnerPlantController {

    private final PlantService plantService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    public ResponseEntity<List<PlantResponse>> getMyStoreProducts(@AuthenticationPrincipal UserDetails userDetails) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(plantService.getStoreOwnerPlants(user));
    }

    @PostMapping
    public ResponseEntity<PlantResponse> createMyStoreProduct(
            @Valid @RequestBody StoreOwnerPlantRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(plantService.createStoreOwnerPlant(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlantResponse> updateMyStoreProduct(
            @PathVariable Integer id,
            @Valid @RequestBody StoreOwnerPlantRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(plantService.updateStoreOwnerPlant(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMyStoreProduct(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        plantService.deleteStoreOwnerPlant(id, user);
        return ResponseEntity.noContent().build();
    }
}
