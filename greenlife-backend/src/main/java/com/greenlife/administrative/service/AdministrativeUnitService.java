package com.greenlife.administrative.service;

import com.greenlife.administrative.dto.AdministrativeCommuneResponse;
import com.greenlife.administrative.dto.AdministrativeProvinceResponse;
import com.greenlife.administrative.entity.AdministrativeCommune;
import com.greenlife.administrative.repository.AdministrativeCommuneRepository;
import com.greenlife.administrative.repository.AdministrativeProvinceRepository;
import com.greenlife.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdministrativeUnitService {

    private final AdministrativeProvinceRepository provinceRepository;
    private final AdministrativeCommuneRepository communeRepository;

    @Transactional(readOnly = true)
    public List<AdministrativeProvinceResponse> getAllProvinces() {
        return provinceRepository.findAllByOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(p -> AdministrativeProvinceResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdministrativeCommuneResponse> getCommunesByProvinceId(Integer provinceId) {
        if (provinceId == null) {
            throw new CustomException("Vui lòng cung cấp provinceId", HttpStatus.BAD_REQUEST);
        }
        if (!provinceRepository.existsById(provinceId)) {
            throw new CustomException("Tỉnh/Thành phố không tồn tại", HttpStatus.NOT_FOUND);
        }
        return communeRepository.findByProvinceIdOrderByTypeAscNameAsc(provinceId)
                .stream()
                .map(this::mapToCommuneResponse)
                .collect(Collectors.toList());
    }

    private AdministrativeCommuneResponse mapToCommuneResponse(AdministrativeCommune c) {
        String displayName = c.getType() + " " + c.getName();
        return AdministrativeCommuneResponse.builder()
                .code(c.getCode())
                .type(c.getType())
                .name(c.getName())
                .displayName(displayName)
                .build();
    }
}
