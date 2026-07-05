package com.greenlife.booking.service;

import com.greenlife.booking.dto.PlantCareServiceRequest;
import com.greenlife.booking.dto.PlantCareServiceResponse;
import com.greenlife.booking.entity.PlantCareService;
import com.greenlife.store.entity.Store;
import com.greenlife.booking.entity.enums.ServiceStatus;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.booking.repository.PlantCareServiceRepository;
import com.greenlife.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PlantCareServiceManager {

    private final PlantCareServiceRepository serviceRepository;
    private final StoreRepository storeRepository;

    @Transactional
    public PlantCareServiceResponse createService(Integer currentUserId, PlantCareServiceRequest request) {
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (!store.getOwner().getId().equals(currentUserId)) {
            throw new CustomException("Bạn không có quyền quản lý dịch vụ cho cửa hàng này", HttpStatus.FORBIDDEN);
        }

        if (store.getStatus() != StoreStatus.APPROVED) {
            throw new CustomException("Cửa hàng chưa được phê duyệt, không thể tạo dịch vụ", HttpStatus.BAD_REQUEST);
        }

        PlantCareService service = PlantCareService.builder()
                .store(store)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .durationMinutes(request.getDurationMinutes())
                .status(ServiceStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        PlantCareService saved = serviceRepository.save(service);
        return mapToResponse(saved);
    }

    @Transactional
    public PlantCareServiceResponse updateService(Integer currentUserId, Integer serviceId, PlantCareServiceRequest request) {
        PlantCareService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new CustomException("Dịch vụ không tồn tại", HttpStatus.NOT_FOUND));

        if (!service.getStore().getOwner().getId().equals(currentUserId)) {
            throw new CustomException("Bạn không có quyền chỉnh sửa dịch vụ của cửa hàng này", HttpStatus.FORBIDDEN);
        }

        if (service.getStore().getStatus() != StoreStatus.APPROVED) {
            throw new CustomException("Cửa hàng không ở trạng thái hoạt động (APPROVED)", HttpStatus.BAD_REQUEST);
        }

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setUpdatedAt(LocalDateTime.now());

        PlantCareService saved = serviceRepository.save(service);
        return mapToResponse(saved);
    }

    @Transactional
    public PlantCareServiceResponse deactivateService(Integer currentUserId, Integer serviceId) {
        PlantCareService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new CustomException("Dịch vụ không tồn tại", HttpStatus.NOT_FOUND));

        if (!service.getStore().getOwner().getId().equals(currentUserId)) {
            throw new CustomException("Bạn không có quyền chỉnh sửa dịch vụ của cửa hàng này", HttpStatus.FORBIDDEN);
        }

        service.setStatus(ServiceStatus.INACTIVE);
        service.setUpdatedAt(LocalDateTime.now());

        PlantCareService saved = serviceRepository.save(service);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<PlantCareServiceResponse> listActiveServices(Integer storeId, int page, int size) {
        int cappedSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return serviceRepository.findActiveServices(storeId, ServiceStatus.ACTIVE, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<PlantCareServiceResponse> listStoreServices(Integer currentUserId, Integer storeId, int page, int size) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException("Cửa hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (!store.getOwner().getId().equals(currentUserId)) {
            throw new CustomException("Bạn không có quyền xem danh sách dịch vụ của cửa hàng này", HttpStatus.FORBIDDEN);
        }

        int cappedSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return serviceRepository.findByStoreId(storeId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public PlantCareServiceResponse getServiceDetail(Integer serviceId) {
        PlantCareService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new CustomException("Dịch vụ không tồn tại", HttpStatus.NOT_FOUND));
        return mapToResponse(service);
    }

    private PlantCareServiceResponse mapToResponse(PlantCareService service) {
        return PlantCareServiceResponse.builder()
                .id(service.getId())
                .storeId(service.getStore().getId())
                .storeName(service.getStore().getName())
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .durationMinutes(service.getDurationMinutes())
                .status(service.getStatus())
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .build();
    }
}
