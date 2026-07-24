package com.greenlife.store.service;

import com.greenlife.common.service.FileStorageService;
import com.greenlife.store.dto.*;
import com.greenlife.store.entity.Store;
import com.greenlife.store.entity.StoreApprovalAudit;
import com.greenlife.user.entity.User;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.exception.InvalidStoreStatusTransitionException;
import com.greenlife.store.repository.StoreApprovalAuditRepository;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.entity.Role;
import com.greenlife.user.repository.RoleRepository;
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
    private final FileStorageService fileStorageService;
    private final RoleRepository roleRepository;
    private final com.greenlife.auth.service.OtpService otpService;

    @Transactional
    public StoreResponse createStore(StoreRequest request, String ownerEmail) {
        User owner = userRepository.findByEmailForUpdate(ownerEmail)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        String currentRole = owner.getRole().getName();
        if (!"CUSTOMER".equalsIgnoreCase(currentRole) && !"STORE_OWNER".equalsIgnoreCase(currentRole)) {
            throw new CustomException("Chỉ khách hàng (CUSTOMER) hoặc chủ cửa hàng (STORE_OWNER) mới có quyền đăng ký cửa hàng", HttpStatus.FORBIDDEN);
        }

        if (request.getShopEmail() == null || request.getShopEmail().isBlank()) {
            throw new CustomException("Email đối tác không được để trống", HttpStatus.BAD_REQUEST);
        }

        // Check if store already exists
        if (!storeRepository.findByOwnerEmail(ownerEmail).isEmpty()) {
            throw new CustomException("Cửa hàng đã được đăng ký cho tài khoản này", HttpStatus.BAD_REQUEST);
        }

        // Consume server-side OTP proof before creating store
        otpService.consumeSellerRegistrationOtpProof(owner, request.getShopEmail());

        String verificationDoc = processKycUrl(request.getVerificationDocument());
        String cccdFront = processKycUrl(request.getCccdFrontUrl());
        String cccdBack = processKycUrl(request.getCccdBackUrl());

        java.util.List<String> storedEvidenceUrls = new java.util.ArrayList<>();
        if (request.getBusinessEvidenceUrls() != null) {
            for (String url : request.getBusinessEvidenceUrls()) {
                String processed = processKycUrl(url);
                if (processed != null && !processed.isBlank()) {
                    storedEvidenceUrls.add(processed);
                }
            }
        }
        String evidenceJson = null;
        if (!storedEvidenceUrls.isEmpty()) {
            try {
                evidenceJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(storedEvidenceUrls);
            } catch (Exception e) {
                evidenceJson = "[\"" + String.join("\",\"", storedEvidenceUrls) + "\"]";
            }
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
                .verificationDocument(verificationDoc != null ? verificationDoc : cccdFront)
                .businessType(request.getBusinessType() != null ? request.getBusinessType() : "PHYSICAL_STORE")
                .cccdFrontUrl(cccdFront)
                .cccdBackUrl(cccdBack)
                .businessEvidenceUrls(evidenceJson)
                .status(StoreStatus.PENDING)
                .build();

        Store savedStore = storeRepository.saveAndFlush(store);
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
        String newVerificationDoc = request.getVerificationDocument();
        if (newVerificationDoc != null && !newVerificationDoc.isBlank()) {
            String oldVerificationDoc = store.getVerificationDocument();
            newVerificationDoc = processKycUrl(newVerificationDoc);
            if (oldVerificationDoc != null && oldVerificationDoc.startsWith("/uploads/kyc/")
                    && !oldVerificationDoc.equals(newVerificationDoc)) {
                fileStorageService.deleteFile(oldVerificationDoc);
            }
        }
        store.setName(request.getName());
        store.setPhone(request.getPhone());
        store.setCity(request.getCity());
        store.setDistrict(request.getDistrict());
        store.setAddress(request.getAddress());
        store.setDescription(request.getDescription());
        store.setLogoUrl(request.getLogoUrl());
        store.setVerificationDocument(newVerificationDoc);
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
    public List<AdminStoreReviewResponse> getPendingStoresForAdmin() {
        return storeRepository.findByStatus(StoreStatus.PENDING).stream()
                .map(this::mapToAdminStoreReviewResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminStoreReviewResponse> getApprovedStoresForAdmin() {
        return storeRepository.findByStatusOrderById(StoreStatus.APPROVED).stream()
                .map(this::mapToAdminStoreReviewResponse)
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

        User owner = store.getOwner();
        if (owner != null && "CUSTOMER".equalsIgnoreCase(owner.getRole().getName())) {
            Role storeOwnerRole = roleRepository.findByName("STORE_OWNER")
                .orElseThrow(() -> new CustomException("Vai trò STORE_OWNER không tồn tại trong hệ thống", HttpStatus.INTERNAL_SERVER_ERROR));
            owner.setRole(storeOwnerRole);
            userRepository.save(owner);
        }

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

    private AdminStoreReviewResponse mapToAdminStoreReviewResponse(Store store) {
        if (store == null) return null;
        User owner = store.getOwner();
        return AdminStoreReviewResponse.builder()
                .id(store.getId())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .name(store.getName())
                .phone(store.getPhone())
                .city(store.getCity())
                .district(store.getDistrict())
                .address(store.getAddress())
                .description(store.getDescription())
                .logoUrl(store.getLogoUrl())
                .verificationDocument(store.getVerificationDocument())
                .businessType(store.getBusinessType())
                .cccdFrontUrl(store.getCccdFrontUrl())
                .cccdBackUrl(store.getCccdBackUrl())
                .businessEvidenceUrls(deserializeEvidenceUrls(store.getBusinessEvidenceUrls()))
                .status(store.getStatus())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }

    private List<String> deserializeEvidenceUrls(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String clean = raw.trim();
        if (clean.startsWith("[")) {
            try {
                return new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                    clean,
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}
                );
            } catch (Exception e) {
                // Fallback to delimiter parsing if JSON parsing fails
            }
        }
        return java.util.Arrays.stream(clean.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
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
                .businessType(store.getBusinessType())
                .status(store.getStatus())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }

    private void checkPathTraversal(String value) {
        if (value != null && (value.contains("..") || value.contains("\\") || value.contains("%2e%2e"))) {
            throw new CustomException("Đường dẫn tài liệu không hợp lệ (phát hiện ký tự traversal)", HttpStatus.BAD_REQUEST);
        }
    }

    private String processKycUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }
        String clean = rawUrl.trim();
        checkPathTraversal(clean);

        if (clean.startsWith("blob:") || clean.startsWith("file:")) {
            throw new CustomException("Không thể xử lý tài liệu xác minh. Vui lòng tải lại ảnh và thử lại.", HttpStatus.BAD_REQUEST);
        }

        if (clean.startsWith("/uploads/kyc/") || clean.startsWith("uploads/kyc/")) {
            String storageKey = clean.startsWith("/") ? clean : "/" + clean;
            validateKycStorageKey(storageKey);
            return storageKey;
        }

        if (clean.startsWith("http://") || clean.startsWith("https://")) {
            if (clean.contains("/uploads/kyc/")) {
                int idx = clean.indexOf("/uploads/kyc/");
                String storageKey = clean.substring(idx);
                validateKycStorageKey(storageKey);
                return storageKey;
            }
            throw new CustomException("Đường dẫn tài liệu xác minh không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        return fileStorageService.storeKycDocument(clean);
    }

    private void validateKycStorageKey(String storageKey) {
        if (storageKey.contains("..") || storageKey.contains("\\") || storageKey.contains("%2e%2e")
                || storageKey.contains("?") || storageKey.contains("#")) {
            throw new CustomException("Đường dẫn tài liệu không hợp lệ (phát hiện ký tự traversal)", HttpStatus.BAD_REQUEST);
        }
        String lower = storageKey.toLowerCase();
        if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
            throw new CustomException("Định dạng tệp tài liệu không được hỗ trợ", HttpStatus.BAD_REQUEST);
        }
    }
}
