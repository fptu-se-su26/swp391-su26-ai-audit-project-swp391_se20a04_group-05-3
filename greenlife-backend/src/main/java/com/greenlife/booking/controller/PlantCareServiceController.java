package com.greenlife.booking.controller;

import com.greenlife.booking.dto.PlantCareServiceRequest;
import com.greenlife.booking.dto.PlantCareServiceResponse;
import com.greenlife.user.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.user.repository.UserRepository;
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
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class PlantCareServiceController {

    private final PlantCareServiceManager serviceManager;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<PlantCareServiceResponse>> getServices(
            @RequestParam(required = false) Integer storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(serviceManager.listActiveServices(storeId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlantCareServiceResponse> getServiceDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(serviceManager.getServiceDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('STORE_OWNER')")
    public ResponseEntity<PlantCareServiceResponse> createService(
            @Valid @RequestBody PlantCareServiceRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        PlantCareServiceResponse created = serviceManager.createService(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STORE_OWNER')")
    public ResponseEntity<PlantCareServiceResponse> updateService(
            @PathVariable Integer id,
            @Valid @RequestBody PlantCareServiceRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(serviceManager.updateService(user.getId(), id, request));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('STORE_OWNER')")
    public ResponseEntity<PlantCareServiceResponse> deactivateService(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(serviceManager.deactivateService(user.getId(), id));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }
}
