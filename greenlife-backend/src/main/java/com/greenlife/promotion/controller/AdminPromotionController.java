package com.greenlife.promotion.controller;

import com.greenlife.promotion.dto.*;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.service.PromotionAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromotionController {

    private final PromotionAdminService promotionAdminService;

    @PostMapping
    public ResponseEntity<PromotionDetailResponse> create(@Valid @RequestBody CreatePromotionRequest request) {
        return ResponseEntity.ok(promotionAdminService.createDraft(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromotionDetailResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody UpdatePromotionDraftRequest request
    ) {
        return ResponseEntity.ok(promotionAdminService.updateDraft(id, request));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<PromotionDetailResponse> activate(
        @PathVariable Integer id,
        @Valid @RequestBody PromotionActionRequest request
    ) {
        return ResponseEntity.ok(promotionAdminService.activate(id, request));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<PromotionDetailResponse> end(
        @PathVariable Integer id,
        @Valid @RequestBody PromotionActionRequest request
    ) {
        return ResponseEntity.ok(promotionAdminService.end(id, request));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PromotionDetailResponse> cancel(
        @PathVariable Integer id,
        @Valid @RequestBody PromotionActionRequest request
    ) {
        return ResponseEntity.ok(promotionAdminService.cancel(id, request));
    }

    @GetMapping
    public ResponseEntity<Page<PromotionSummaryResponse>> list(
        @RequestParam(required = false) PromotionStatus status,
        @RequestParam(required = false) PromotionScopeType scopeType,
        @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(promotionAdminService.list(status, scopeType, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromotionDetailResponse> get(@PathVariable Integer id) {
        return ResponseEntity.ok(promotionAdminService.getDetail(id));
    }
}
