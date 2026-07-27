package com.greenlife.administrative.controller;

import com.greenlife.administrative.dto.AdministrativeCommuneResponse;
import com.greenlife.administrative.dto.AdministrativeProvinceResponse;
import com.greenlife.administrative.service.AdministrativeUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administrative")
@RequiredArgsConstructor
public class AdministrativeUnitController {

    private final AdministrativeUnitService administrativeService;

    @GetMapping("/provinces")
    public ResponseEntity<List<AdministrativeProvinceResponse>> getProvinces() {
        return ResponseEntity.ok(administrativeService.getAllProvinces());
    }

    @GetMapping("/communes")
    public ResponseEntity<List<AdministrativeCommuneResponse>> getCommunes(@RequestParam("provinceId") Integer provinceId) {
        return ResponseEntity.ok(administrativeService.getCommunesByProvinceId(provinceId));
    }
}
