package com.greenlife.user.service;

import com.greenlife.user.dto.AddressRequest;
import com.greenlife.user.dto.AddressResponse;
import com.greenlife.user.entity.CustomerAddress;
import com.greenlife.user.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.user.repository.CustomerAddressRepository;
import com.greenlife.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerAddressService {

    private final CustomerAddressRepository addressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AddressResponse> getCustomerAddresses(Integer customerId) {
        return addressRepository.findByCustomerIdOrderByIsDefaultDescUpdatedAtDescCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AddressResponse getDefaultAddress(Integer customerId) {
        CustomerAddress address = addressRepository.findByCustomerIdAndIsDefaultTrue(customerId)
                .orElseThrow(() -> new CustomException("Không tìm thấy địa chỉ mặc định", HttpStatus.NOT_FOUND));
        return mapToResponse(address);
    }

    @Transactional
    public AddressResponse createAddress(Integer customerId, AddressRequest request) {
        long addressCount = addressRepository.countByCustomerId(customerId);
        if (addressCount >= 10) {
            throw new CustomException("Vượt quá số lượng địa chỉ tối đa cho phép (10)", HttpStatus.BAD_REQUEST);
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        boolean shouldBeDefault = (addressCount == 0) || Boolean.TRUE.equals(request.getIsDefault());

        if (shouldBeDefault) {
            clearCurrentDefault(customerId);
        }

        CustomerAddress address = CustomerAddress.builder()
                .customer(customer)
                .recipientName(request.getRecipientName())
                .phone(request.getPhone())
                .addressLine(request.getAddressLine())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .isDefault(shouldBeDefault)
                .createdAt(LocalDateTime.now())
                .build();

        CustomerAddress saved = addressRepository.saveAndFlush(address);
        return mapToResponse(saved);
    }

    @Transactional
    public AddressResponse updateAddress(Integer customerId, Integer addressId, AddressRequest request) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new CustomException("Địa chỉ không tồn tại", HttpStatus.NOT_FOUND));

        if (!address.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền chỉnh sửa địa chỉ này", HttpStatus.FORBIDDEN);
        }

        boolean currentDefaultStatus = address.getIsDefault();
        boolean requestedDefaultStatus = Boolean.TRUE.equals(request.getIsDefault());

        if (currentDefaultStatus && !requestedDefaultStatus) {
            // Cannot unset default if it's the only address
            long addressCount = addressRepository.countByCustomerId(customerId);
            if (addressCount > 1) {
                throw new CustomException("Không thể hủy địa chỉ mặc định trực tiếp. Vui lòng thiết lập địa chỉ khác làm mặc định.", HttpStatus.BAD_REQUEST);
            } else {
                // If it's the only address, it must remain default
                requestedDefaultStatus = true;
            }
        }

        if (!currentDefaultStatus && requestedDefaultStatus) {
            clearCurrentDefault(customerId);
        }

        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAddressLine(request.getAddressLine());
        address.setWard(request.getWard());
        address.setDistrict(request.getDistrict());
        address.setCity(request.getCity());
        address.setIsDefault(requestedDefaultStatus);
        address.setUpdatedAt(LocalDateTime.now());

        CustomerAddress saved = addressRepository.saveAndFlush(address);
        return mapToResponse(saved);
    }

    @Transactional
    public AddressResponse setDefaultAddress(Integer customerId, Integer addressId) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new CustomException("Địa chỉ không tồn tại", HttpStatus.NOT_FOUND));

        if (!address.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền thay đổi địa chỉ này", HttpStatus.FORBIDDEN);
        }

        if (!address.getIsDefault()) {
            clearCurrentDefault(customerId);
            address.setIsDefault(true);
            address.setUpdatedAt(LocalDateTime.now());
            address = addressRepository.saveAndFlush(address);
        }

        return mapToResponse(address);
    }

    @Transactional
    public void deleteAddress(Integer customerId, Integer addressId) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new CustomException("Địa chỉ không tồn tại", HttpStatus.NOT_FOUND));

        if (!address.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền xóa địa chỉ này", HttpStatus.FORBIDDEN);
        }

        boolean wasDefault = address.getIsDefault();

        // Delete first to release the default constraint in the database
        addressRepository.delete(address);
        addressRepository.flush();

        if (wasDefault) {
            // Promote next address if available
            Optional<CustomerAddress> nextDefault = addressRepository
                    .findFirstByCustomerIdAndIdNotOrderByUpdatedAtDesc(customerId, addressId);
            
            if (nextDefault.isPresent()) {
                CustomerAddress newDefault = nextDefault.get();
                newDefault.setIsDefault(true);
                newDefault.setUpdatedAt(LocalDateTime.now());
                addressRepository.saveAndFlush(newDefault);
            }
        }
    }

    private void clearCurrentDefault(Integer customerId) {
        addressRepository.findByCustomerIdAndIsDefaultTrue(customerId)
                .ifPresent(oldDefault -> {
                    oldDefault.setIsDefault(false);
                    oldDefault.setUpdatedAt(LocalDateTime.now());
                    addressRepository.saveAndFlush(oldDefault);
                });
    }

    private AddressResponse mapToResponse(CustomerAddress address) {
        return AddressResponse.builder()
                .id(address.getId())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .addressLine(address.getAddressLine())
                .ward(address.getWard())
                .district(address.getDistrict())
                .city(address.getCity())
                .isDefault(address.getIsDefault())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
