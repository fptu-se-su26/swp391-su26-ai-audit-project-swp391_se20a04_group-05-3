package com.greenlife.controller;

import com.greenlife.dto.PlantRequest;
import com.greenlife.dto.PlantResponse;
import com.greenlife.service.PlantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlantController {

    private final PlantService plantService;

    @GetMapping("/products")
    public ResponseEntity<Page<PlantResponse>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(plantService.getActivePlants(search, category, pageable));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<PlantResponse> getProductById(@PathVariable Integer id) {
        return ResponseEntity.ok(plantService.getPlantByIdPublic(id));
    }

    @PostMapping("/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlantResponse> createProduct(@Valid @RequestBody PlantRequest request) {
        return ResponseEntity.ok(plantService.createPlant(request));
    }

    @PutMapping("/admin/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlantResponse> updateProduct(
            @PathVariable Integer id,
            @Valid @RequestBody PlantRequest request
    ) {
        return ResponseEntity.ok(plantService.updatePlant(id, request));
    }

    @DeleteMapping("/admin/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        plantService.softDeletePlant(id);
        return ResponseEntity.noContent().build();
    }
}
