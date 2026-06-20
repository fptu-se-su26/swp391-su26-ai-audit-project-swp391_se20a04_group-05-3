package com.greenlife.service;

import com.greenlife.dto.*;
import com.greenlife.entity.Store;
import com.greenlife.entity.StoreApprovalAudit;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.StoreStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.exception.InvalidStoreStatusTransitionException;
import com.greenlife.repository.StoreApprovalAuditRepository;
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
    private final StoreApprovalAuditRepository storeApprovalAuditRepository;

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
                .status(StoreStatus.PENDING)
                .build();

        Store savedStore = storeRepository.save(store);
        return mapToStoreResponse(savedStore);
    }

    @Transactional(readOnly = true)
    public StoreResponse getStoreProfile(String ownerEmail) {
        List<Store> stores = storeRepository.findByOwnerEmail(ownerEmail);
        Store store = stores.stream()
                .findFirst()
                .orElseThrow(() -> new CustomException("Cửa hàng chưa được đăng ký", HttpStatus.NOT_FOUND));
        return mapToStoreResponse(store);
    }

    @Transactional
    public StoreResponse updateStoreProfile(StoreRequest request, String ownerEmail) {
        List<Store> stores = storeRepository.findByOwnerEmail(ownerEmail);
        Store store = stores.stream()
                .findFirst()
                .orElseThrow(() -> new CustomException("Cửa hàng chưa được đăng ký", HttpStatus.NOT_FOUND));
        store.setName(request.getName());
        store.setPhone(request.getPhone());
        store.setCity(request.getCity());
        store.setDistrict(request.getDistrict());
        store.setAddress(request.getAddress());
        store.setDescription(request.getDescription());
        store.setLogoUrl(request.getLogoUrl());
        store.setVerificationDocument(request.getVerificationDocument());
        store.setUpdatedAt(LocalDateTime.now());

        if (store.getStatus() == StoreStatus.REJECTED) {
            store.setStatus(StoreStatus.PENDING);
        }

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
        return storeRepository.findByStatus(StoreStatus.PENDING).stream()
                .map(this::mapToStoreResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public StoreResponse approveStore(Integer storeId, ApproveStoreRequest request, String adminEmail) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        if (store.getStatus() != StoreStatus.PENDING) {
            throw new InvalidStoreStatusTransitionException("Chỉ có thể phê duyệt cửa hàng đang chờ duyệt");
        }

        StoreApprovalAudit audit = StoreApprovalAudit.builder()
                .store(store)
                .admin(admin)
                .oldStatus(store.getStatus())
                .newStatus(StoreStatus.APPROVED)
                .reason(request != null ? request.getReason() : null)
                .createdAt(LocalDateTime.now())
                .build();
        storeApprovalAuditRepository.save(audit);

        store.setStatus(StoreStatus.APPROVED);
        store.setUpdatedAt(LocalDateTime.now());
        Store savedStore = storeRepository.save(store);
        return mapToStoreResponse(savedStore);
    }

    @Transactional
    public StoreResponse rejectStore(Integer storeId, RejectStoreRequest request, String adminEmail) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        if (store.getStatus() != StoreStatus.PENDING) {
            throw new InvalidStoreStatusTransitionException("Chỉ có thể từ chối cửa hàng đang chờ duyệt");
        }

        StoreApprovalAudit audit = StoreApprovalAudit.builder()
                .store(store)
                .admin(admin)
                .oldStatus(store.getStatus())
                .newStatus(StoreStatus.REJECTED)
                .reason(request.getReason())
                .createdAt(LocalDateTime.now())
                .build();
        storeApprovalAuditRepository.save(audit);

        store.setStatus(StoreStatus.REJECTED);
        store.setUpdatedAt(LocalDateTime.now());
        Store savedStore = storeRepository.save(store);
        return mapToStoreResponse(savedStore);
    }

    @Transactional(readOnly = true)
    public List<StoreApprovalAuditResponse> getAuditHistory(Integer storeId) {
        if (!storeRepository.existsById(storeId)) {
            throw new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND);
        }
        return storeApprovalAuditRepository.findByStoreId(storeId).stream()
                .map(audit -> StoreApprovalAuditResponse.builder()
                        .id(audit.getId())
                        .storeId(audit.getStore().getId())
                        .storeName(audit.getStore().getName())
                        .adminId(audit.getAdmin().getId())
                        .adminName(audit.getAdmin().getFullName())
                        .oldStatus(audit.getOldStatus())
                        .newStatus(audit.getNewStatus())
                        .reason(audit.getReason())
                        .createdAt(audit.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private StoreResponse mapToStoreResponse(Store store) {
        if (store == null) {
            throw new IllegalArgumentException("Store cannot be null");
        }
        User owner = store.getOwner();
        if (owner == null) {
            throw new IllegalStateException("Store owner cannot be null");
        }
        return StoreResponse.builder()
                .id(store.getId())
                .ownerId(owner.getId())
                .ownerName(owner.getFullName())
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
