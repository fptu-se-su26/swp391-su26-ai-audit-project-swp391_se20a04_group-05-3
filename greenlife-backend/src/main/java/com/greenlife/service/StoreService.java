package com.greenlife.service;

import com.greenlife.dto.StoreRequest;
import com.greenlife.dto.StoreResponse;
import com.greenlife.entity.Store;
import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.StoreRepository;
import com.greenlife.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    @Transactional
    public StoreResponse createStore(StoreRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        if (!"STORE_OWNER".equalsIgnoreCase(owner.getRole().getName())) {
            throw new CustomException("Chỉ chủ cửa hàng (STORE_OWNER) mới có quyền đăng ký thông tin cửa hàng", HttpStatus.FORBIDDEN);
        }

        // Check if store already exists
        if (!storeRepository.findByOwnerEmail(ownerEmail).isEmpty()) {
            throw new CustomException("Cửa hàng đã được đăng ký cho tài khoản này", HttpStatus.BAD_REQUEST);
        }

        Store store = Store.builder()
                .owner(owner)
                .name(request.getName())
                .phone(request.getPhone())
                .city(request.getCity())
                .district(request.getDistrict())
                .address(request.getAddress())
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .verificationDocument(request.getVerificationDocument())
                .status("PENDING")
                .build();

        Store savedStore = storeRepository.save(store);
        return mapToStoreResponse(savedStore);
    }

    @Transactional(readOnly = true)
    public StoreResponse getStoreProfile(String ownerEmail) {
        List<Store> stores = storeRepository.findByOwnerEmail(ownerEmail);
        if (stores.isEmpty()) {
            throw new CustomException("Cửa hàng chưa được đăng ký", HttpStatus.NOT_FOUND);
        }
        return mapToStoreResponse(stores.get(0));
    }

    @Transactional
    public StoreResponse updateStoreProfile(StoreRequest request, String ownerEmail) {
        List<Store> stores = storeRepository.findByOwnerEmail(ownerEmail);
        if (stores.isEmpty()) {
            throw new CustomException("Cửa hàng chưa được đăng ký", HttpStatus.NOT_FOUND);
        }
        Store store = stores.get(0);
        store.setName(request.getName());
        store.setPhone(request.getPhone());
        store.setCity(request.getCity());
        store.setDistrict(request.getDistrict());
        store.setAddress(request.getAddress());
        store.setDescription(request.getDescription());
        store.setLogoUrl(request.getLogoUrl());
        store.setVerificationDocument(request.getVerificationDocument());
        store.setUpdatedAt(LocalDateTime.now());

        Store savedStore = storeRepository.save(store);
        return mapToStoreResponse(savedStore);
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> getStoresByOwner(String ownerEmail) {
        return storeRepository.findByOwnerEmail(ownerEmail).stream()
                .map(this::mapToStoreResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StoreResponse> getPendingStores() {
        return storeRepository.findByStatus("PENDING").stream()
                .map(this::mapToStoreResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public StoreResponse approveStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

        store.setStatus("APPROVED");
        store.setUpdatedAt(LocalDateTime.now());
        Store savedStore = storeRepository.save(store);
        return mapToStoreResponse(savedStore);
    }

    @Transactional
    public StoreResponse rejectStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

        store.setStatus("REJECTED");
        store.setUpdatedAt(LocalDateTime.now());
        Store savedStore = storeRepository.save(store);
        return mapToStoreResponse(savedStore);
    }

    private StoreResponse mapToStoreResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getId())
                .ownerId(store.getOwner().getId())
                .ownerName(store.getOwner().getFullName())
                .name(store.getName())
                .phone(store.getPhone())
                .city(store.getCity())
                .district(store.getDistrict())
                .address(store.getAddress())
                .description(store.getDescription())
                .logoUrl(store.getLogoUrl())
                .verificationDocument(store.getVerificationDocument())
                .status(store.getStatus())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
}
