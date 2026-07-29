package com.greenlife.user.controller;

import com.greenlife.user.dto.AddressRequest;
import com.greenlife.user.dto.AddressResponse;
import com.greenlife.user.entity.User;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.user.service.CustomerAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class CustomerAddressController {

    private final CustomerAddressService addressService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<List<AddressResponse>> getAddresses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(addressService.getCustomerAddresses(user.getId()));
    }

    @GetMapping("/default")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<AddressResponse> getDefaultAddress(@AuthenticationPrincipal UserDetails userDetails) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(addressService.getDefaultAddress(user.getId()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<AddressResponse> createAddress(
            @Valid @RequestBody AddressRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        AddressResponse created = addressService.createAddress(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Integer id,
            @Valid @RequestBody AddressRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(addressService.updateAddress(user.getId(), id, request));
    }

    @PutMapping("/{id}/default")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<AddressResponse> setDefaultAddress(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        return ResponseEntity.ok(addressService.setDefaultAddress(user.getId(), id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER')")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        addressService.deleteAddress(user.getId(), id);
        return ResponseEntity.noContent().build();
    }








}
