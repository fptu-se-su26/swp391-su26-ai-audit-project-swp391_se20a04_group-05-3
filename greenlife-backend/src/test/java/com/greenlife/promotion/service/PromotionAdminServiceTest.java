package com.greenlife.promotion.service;

import com.greenlife.exception.CustomException;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.promotion.dto.*;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionAuditHistory;
import com.greenlife.promotion.entity.PromotionProduct;
import com.greenlife.promotion.entity.PromotionStore;
import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.repository.PromotionAuditHistoryRepository;
import com.greenlife.promotion.repository.PromotionProductRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.promotion.repository.PromotionStoreRepository;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.store.entity.Store;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.entity.Role;
import com.greenlife.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PromotionAdminServiceTest {

    private PromotionRepository promotionRepository;
    private PromotionStoreRepository promotionStoreRepository;
    private PromotionProductRepository promotionProductRepository;
    private PromotionAuditHistoryRepository promotionAuditHistoryRepository;
    private StoreRepository storeRepository;
    private PlantRepository plantRepository;
    private CurrentUserResolver currentUserResolver;
    private Clock clock;

    private PromotionAdminService service;

    private User adminActor;
    private LocalDateTime fixedNow;

    @BeforeEach
    void setUp() {
        promotionRepository = mock(PromotionRepository.class);
        promotionStoreRepository = mock(PromotionStoreRepository.class);
        promotionProductRepository = mock(PromotionProductRepository.class);
        promotionAuditHistoryRepository = mock(PromotionAuditHistoryRepository.class);
        storeRepository = mock(StoreRepository.class);
        plantRepository = mock(PlantRepository.class);
        currentUserResolver = mock(CurrentUserResolver.class);

        // Fixed UTC clock setup
        fixedNow = LocalDateTime.of(2026, 7, 16, 12, 0, 0);
        Instant instant = fixedNow.toInstant(ZoneOffset.UTC);
        clock = Clock.fixed(instant, ZoneOffset.UTC);

        service = new PromotionAdminService(
            promotionRepository,
            promotionStoreRepository,
            promotionProductRepository,
            promotionAuditHistoryRepository,
            storeRepository,
            plantRepository,
            currentUserResolver,
            clock
        );

        // Mock current authenticated user as ADMIN
        Role adminRole = Role.builder().name("ADMIN").build();
        adminActor = User.builder().id(99).email("admin@greenlife.com").role(adminRole).build();

        mockSecurityContext("ADMIN", adminActor);
    }

    private void mockSecurityContext(String roleName, User userEntity) {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        UserDetails userDetails = mock(UserDetails.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(currentUserResolver.resolveUser(userDetails)).thenReturn(userEntity);

        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private CreatePromotionRequest createValidRequest() {
        return new CreatePromotionRequest(
            "Mừng khai trương",
            "Mô tả chi tiết",
            PromotionScopeType.GLOBAL,
            PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"),
            new BigDecimal("50000"),
            PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"),
            new BigDecimal("0"),
            2,
            new BigDecimal("10000000"),
            List.of(),
            List.of()
        );
    }

    private Promotion.PromotionBuilder createValidPromotionBuilder() {
        return Promotion.builder()
            .id(1)
            .name("Promo")
            .scopeType(PromotionScopeType.GLOBAL)
            .discountType(PromotionDiscountType.PERCENTAGE)
            .discountValue(new BigDecimal("10"))
            .maxDiscountAmount(new BigDecimal("50000"))
            .fundingSource(PromotionFundingSource.PLATFORM_FUNDED)
            .platformFundingRatio(new BigDecimal("100"))
            .storeFundingRatio(BigDecimal.ZERO)
            .priority(2)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .releasedBudget(BigDecimal.ZERO)
            .version(0);
    }

    @Test
    void test1_percentageGreater100Rejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("101"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("phần trăm không được vượt quá 100"));
    }

    @Test
    void test2_fractionalPercentageRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("15.5"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("phải là số nguyên"));
    }

    @Test
    void test3_fixedLessOrEqualZeroRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            BigDecimal.ZERO, null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("phải lớn hơn hoặc bằng 1"));
    }

    @Test
    void test4_zeroMaxDiscountRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), BigDecimal.ZERO, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Giới hạn giảm giá tối đa phải lớn hơn 0"));
    }

    @Test
    void test5_invalidPlatformFundedRatiosRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("90"), new BigDecimal("10"), 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("nhà vườn không hợp lệ"));
    }

    @Test
    void test6_invalidStoreFundedRatiosRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.STORE_FUNDED,
            new BigDecimal("10"), new BigDecimal("90"), 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("nền tảng không hợp lệ"));
    }

    @Test
    void test7_invalidCoFundedSumRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.CO_FUNDED,
            new BigDecimal("50"), new BigDecimal("40"), 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Tổng tỷ lệ tài trợ phải bằng 100%"));
    }

    @Test
    void test8_validRatiosAccepted() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        Promotion p = createValidPromotionBuilder().build();
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        assertNotNull(service.createDraft(req));
    }

    @Test
    void test9_duplicateTargetIdsRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.STORE, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(1, 1), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("trùng lặp"));
    }

    @Test
    void test10_invalidMixedScopeTargetsRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(1), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Khuyến mãi toàn sàn không được chứa"));
    }

    @Test
    void test11_missingStoreRejected404() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.STORE, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(999), List.of()
        );
        when(storeRepository.findAllById(any())).thenReturn(List.of());
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void test12_nonApprovedStoreRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.STORE, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(1), List.of()
        );
        Store s = Store.builder().id(1).name("Store 1").status(StoreStatus.PENDING).build();
        when(storeRepository.findAllById(any())).thenReturn(List.of(s));
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("chưa được duyệt"));
    }

    @Test
    void test13_missingPlantRejected404() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.PRODUCT, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of(999)
        );
        when(plantRepository.findAllById(any())).thenReturn(List.of());
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void test14_inactivePlantRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.PRODUCT, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of(1)
        );
        Plant p = Plant.builder().id(1).name("Plant 1").status(PlantStatus.INACTIVE).build();
        when(plantRepository.findAllById(any())).thenReturn(List.of(p));
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("không hoạt động"));
    }

    @Test
    void test15_plantWithNonApprovedStoreRejected() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.PRODUCT, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of(1)
        );
        Store s = Store.builder().id(1).status(StoreStatus.PENDING).build();
        Plant p = Plant.builder().id(1).name("Plant 1").status(PlantStatus.ACTIVE).store(s).build();
        when(plantRepository.findAllById(any())).thenReturn(List.of(p));
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("chưa được duyệt"));
    }

    @Test
    void test16_createsDraftWithZeroCountersAndMetadata() {
        CreatePromotionRequest req = createValidRequest();
        Promotion p = Promotion.builder()
            .id(123)
            .name(req.name())
            .scopeType(req.scopeType())
            .discountType(req.discountType())
            .discountValue(req.discountValue())
            .maxDiscountAmount(req.maxDiscountAmount())
            .fundingSource(req.fundingSource())
            .platformFundingRatio(req.platformFundingRatio())
            .storeFundingRatio(req.storeFundingRatio())
            .priority(req.priority())
            .budget(req.budget())
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .releasedBudget(BigDecimal.ZERO)
            .status(PromotionStatus.DRAFT)
            .createdBy(adminActor)
            .createdAt(fixedNow)
            .version(0)
            .build();

        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.createDraft(req);

        assertEquals(123, resp.id());
        assertEquals(PromotionStatus.DRAFT, resp.status());
        assertEquals(BigDecimal.ZERO, resp.reservedBudget());
        assertEquals(BigDecimal.ZERO, resp.consumedBudget());
        assertEquals(BigDecimal.ZERO, resp.releasedBudget());
        assertEquals(adminActor.getId(), resp.createdById());
        assertEquals(fixedNow, resp.createdAt());

        // Verifying CREATED audit log was saved
        ArgumentCaptor<PromotionAuditHistory> auditCaptor = ArgumentCaptor.forClass(PromotionAuditHistory.class);
        verify(promotionAuditHistoryRepository).save(auditCaptor.capture());
        PromotionAuditHistory audit = auditCaptor.getValue();
        assertEquals("CREATED", audit.getActionType());
        assertEquals(PromotionStatus.DRAFT, audit.getNewStatus());
        assertEquals(fixedNow, audit.getCreatedAt());
        assertEquals(adminActor.getId(), audit.getActorUser().getId());
    }

    @Test
    void test22_updateDraftMissingPromotion404() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of(), 0
        );
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.empty());
        CustomException ex = assertThrows(CustomException.class, () -> service.updateDraft(1, req));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void test23_updateDraftStaleVersion409() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of(), 0
        );
        Promotion p = Promotion.builder().id(1).version(1).status(PromotionStatus.DRAFT).build();
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        CustomException ex = assertThrows(CustomException.class, () -> service.updateDraft(1, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void test24_updateDraftNonDraftUpdate409() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of(), 0
        );
        Promotion p = Promotion.builder().id(1).version(0).status(PromotionStatus.ACTIVE).build();
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        CustomException ex = assertThrows(CustomException.class, () -> service.updateDraft(1, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void test25_updateDraftSuccess() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "New Name", "New Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("15"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("2000000"), List.of(), List.of(), 0
        );
        Promotion p = Promotion.builder()
            .id(1)
            .name("Old Name")
            .status(PromotionStatus.DRAFT)
            .version(0)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(BigDecimal.ZERO)
            .consumedBudget(BigDecimal.ZERO)
            .createdBy(adminActor)
            .createdAt(fixedNow.minusDays(1))
            .build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.updateDraft(1, req);

        assertEquals("New Name", resp.name());
        assertEquals("New Desc", resp.description());
        assertEquals(new BigDecimal("2000000"), resp.budget());
        assertEquals(fixedNow.minusDays(1), resp.createdAt()); // CreatedAt should be preserved

        verify(promotionStoreRepository).deleteAllByPromotionId(1);
        verify(promotionProductRepository).deleteAllByPromotionId(1);
        verify(promotionStoreRepository, atLeastOnce()).flush();
        verify(promotionProductRepository, atLeastOnce()).flush();

        ArgumentCaptor<PromotionAuditHistory> auditCaptor = ArgumentCaptor.forClass(PromotionAuditHistory.class);
        verify(promotionAuditHistoryRepository).save(auditCaptor.capture());
        PromotionAuditHistory audit = auditCaptor.getValue();
        assertEquals("UPDATED_DRAFT", audit.getActionType());
        assertEquals(PromotionStatus.DRAFT, audit.getNewStatus());
    }

    @Test
    void test31_validDraftActivates() {
        PromotionActionRequest req = new PromotionActionRequest("Kích hoạt chiến dịch", 0);
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.DRAFT)
            .build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.activate(1, req);

        assertEquals(PromotionStatus.ACTIVE, resp.status());
        assertEquals(adminActor.getId(), resp.activatedById());
        assertEquals(fixedNow, resp.activatedAt());

        ArgumentCaptor<PromotionAuditHistory> auditCaptor = ArgumentCaptor.forClass(PromotionAuditHistory.class);
        verify(promotionAuditHistoryRepository).save(auditCaptor.capture());
        PromotionAuditHistory audit = auditCaptor.getValue();
        assertEquals("ACTIVATED", audit.getActionType());
        assertEquals("Kích hoạt chiến dịch", audit.getReason());
    }

    @Test
    void test35_activationRejectedIfBudgetExceeded() {
        PromotionActionRequest req = new PromotionActionRequest("Kích hoạt", 0);
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.DRAFT)
            .budget(new BigDecimal("1000000"))
            .reservedBudget(new BigDecimal("600000"))
            .consumedBudget(new BigDecimal("500000")) // Sum = 1,100,000 > 1,000,000
            .build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));

        CustomException ex = assertThrows(CustomException.class, () -> service.activate(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().toLowerCase().contains("ngân sách hiện tại không hợp lệ"));
    }

    @Test
    void test37_activeToEndedSucceeds() {
        PromotionActionRequest req = new PromotionActionRequest("Chiến dịch hết hạn", 0);
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.ACTIVE)
            .build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.end(1, req);

        assertEquals(PromotionStatus.ENDED, resp.status());
        assertEquals(adminActor.getId(), resp.endedById());
        assertEquals(fixedNow, resp.endedAt());
        assertEquals("Chiến dịch hết hạn", resp.endReason());
    }

    @Test
    void test41_draftToCancelledSucceeds() {
        PromotionActionRequest req = new PromotionActionRequest("Hủy bỏ do sai sót", 0);
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.DRAFT)
            .build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.cancel(1, req);

        assertEquals(PromotionStatus.CANCELLED, resp.status());
        assertNull(resp.activatedAt());
        assertNull(resp.endedAt());
    }

    @Test
    void test46_listBranchFilters() {
        Pageable pageable = PageRequest.of(0, 10);
        Promotion p = createValidPromotionBuilder().build();
        Page<Promotion> page = new PageImpl<>(List.of(p));

        when(promotionRepository.findByStatusAndScopeType(any(), any(), any())).thenReturn(page);
        when(promotionRepository.findByStatus(any(), any())).thenReturn(page);
        when(promotionRepository.findByScopeType(any(), any())).thenReturn(page);
        when(promotionRepository.findAll(pageable)).thenReturn(page);

        assertNotNull(service.list(PromotionStatus.ACTIVE, PromotionScopeType.GLOBAL, pageable));
        verify(promotionRepository).findByStatusAndScopeType(PromotionStatus.ACTIVE, PromotionScopeType.GLOBAL, pageable);

        assertNotNull(service.list(PromotionStatus.ACTIVE, null, pageable));
        verify(promotionRepository).findByStatus(PromotionStatus.ACTIVE, pageable);

        assertNotNull(service.list(null, PromotionScopeType.GLOBAL, pageable));
        verify(promotionRepository).findByScopeType(PromotionScopeType.GLOBAL, pageable);

        assertNotNull(service.list(null, null, pageable));
        verify(promotionRepository).findAll(pageable);
    }

    @Test
    void test47_availableBudgetCalculatedAndValidated() {
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.ACTIVE)
            .budget(new BigDecimal("100000"))
            .reservedBudget(new BigDecimal("30000"))
            .consumedBudget(new BigDecimal("20000"))
            .build();

        when(promotionRepository.findById(1)).thenReturn(Optional.of(p));

        PromotionDetailResponse resp = service.getDetail(1);
        assertEquals(new BigDecimal("50000"), resp.availableBudget());
    }

    @Test
    void test48_negativeBudgetRejected() {
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.ACTIVE)
            .budget(new BigDecimal("100000"))
            .reservedBudget(new BigDecimal("70000"))
            .consumedBudget(new BigDecimal("40000")) // sum = 110000 > 100000
            .build();

        when(promotionRepository.findById(1)).thenReturn(Optional.of(p));

        CustomException ex = assertThrows(CustomException.class, () -> service.getDetail(1));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ex.getStatus());
        assertTrue(ex.getMessage().contains("ngân sách khả dụng không nhất quán"));
    }

    // --- HARDENED TESTS PHASE 8D.1B.R ---

    @Test
    void test50_unauthenticatedUserThrows401() {
        SecurityContextHolder.clearContext();
        CreatePromotionRequest req = createValidRequest();
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void test51_nonAdminUserThrows403() {
        Role customerRole = Role.builder().name("CUSTOMER").build();
        User customerActor = User.builder().id(12).role(customerRole).build();
        mockSecurityContext("CUSTOMER", customerActor);

        CreatePromotionRequest req = createValidRequest();
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void test53_reasonTrimAndBlankToNull() {
        PromotionActionRequest req = new PromotionActionRequest("   ", 0);
        Promotion p = createValidPromotionBuilder().status(PromotionStatus.DRAFT).build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.activate(1, req);
        assertNull(resp.endReason());

        ArgumentCaptor<PromotionAuditHistory> auditCaptor = ArgumentCaptor.forClass(PromotionAuditHistory.class);
        verify(promotionAuditHistoryRepository).save(auditCaptor.capture());
        assertNull(auditCaptor.getValue().getReason());
    }

    @Test
    void test54_reasonExactly250CharsAccepted() {
        String exact250 = "a".repeat(250);
        PromotionActionRequest req = new PromotionActionRequest(exact250, 0);
        Promotion p = createValidPromotionBuilder().status(PromotionStatus.DRAFT).build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.activate(1, req);
        assertNotNull(resp);
    }

    @Test
    void test55_reason251CharsThrows400() {
        String exact251 = "a".repeat(251);
        PromotionActionRequest req = new PromotionActionRequest(exact251, 0);

        CustomException ex = assertThrows(CustomException.class, () -> service.activate(1, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("vượt quá 250 ký tự"));
    }

    @Test
    void test56_invalidReasonPreventsSaves() {
        String invalidReason = "a".repeat(251);
        PromotionActionRequest req = new PromotionActionRequest(invalidReason, 0);

        assertThrows(CustomException.class, () -> service.activate(1, req));

        verify(promotionRepository, never()).saveAndFlush(any());
        verify(promotionAuditHistoryRepository, never()).save(any());
    }

    @Test
    void test57_endReasonIdenticalToEndAndAudit() {
        PromotionActionRequest req = new PromotionActionRequest("  Campaign Ended Successfully   ", 0);
        Promotion p = createValidPromotionBuilder().status(PromotionStatus.ACTIVE).build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        PromotionDetailResponse resp = service.end(1, req);

        assertEquals("Campaign Ended Successfully", resp.endReason());

        ArgumentCaptor<PromotionAuditHistory> auditCaptor = ArgumentCaptor.forClass(PromotionAuditHistory.class);
        verify(promotionAuditHistoryRepository).save(auditCaptor.capture());
        assertEquals("Campaign Ended Successfully", auditCaptor.getValue().getReason());
    }

    @Test
    void test58_updateDraftTargetReplacementSequenceInOrder() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "New Name", "New Desc", PromotionScopeType.STORE, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("15"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("2000000"), List.of(10), List.of(), 0
        );

        Promotion p = createValidPromotionBuilder()
            .scopeType(PromotionScopeType.GLOBAL)
            .status(PromotionStatus.DRAFT)
            .build();

        Store s = Store.builder().id(10).name("Approved Store").status(StoreStatus.APPROVED).build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(storeRepository.findAllById(any())).thenReturn(List.of(s));
        when(promotionRepository.saveAndFlush(any())).thenReturn(p);

        service.updateDraft(1, req);

        InOrder inOrder = inOrder(
            storeRepository,
            promotionStoreRepository,
            promotionProductRepository,
            promotionAuditHistoryRepository,
            promotionRepository
        );

        // 1. Resolve and validate targets first
        inOrder.verify(storeRepository).findAllById(List.of(10));

        // 2. Delete old mappings next
        inOrder.verify(promotionStoreRepository).deleteAllByPromotionId(1);
        inOrder.verify(promotionProductRepository).deleteAllByPromotionId(1);

        // 3. Flush delete operations next
        inOrder.verify(promotionStoreRepository).flush();
        inOrder.verify(promotionProductRepository).flush();

        // 4. Save new mapping next
        inOrder.verify(promotionStoreRepository).save(any());

        // 5. Save audit history next
        inOrder.verify(promotionAuditHistoryRepository).save(any());

        // 6. Save and flush the promotion next
        inOrder.verify(promotionRepository).saveAndFlush(any());

        // 7. Second flush at the end of the method
        inOrder.verify(promotionStoreRepository).flush();
        inOrder.verify(promotionProductRepository).flush();
        inOrder.verify(promotionAuditHistoryRepository).flush();
    }

    @Test
    void test59_updateDraftMissingTargetCausesZeroChanges() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "New Name", "New Desc", PromotionScopeType.STORE, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("15"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("2000000"), List.of(999), List.of(), 0
        );

        Promotion p = createValidPromotionBuilder().status(PromotionStatus.DRAFT).build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(storeRepository.findAllById(any())).thenReturn(List.of()); // Missing target ID 999

        assertThrows(CustomException.class, () -> service.updateDraft(1, req));

        // Zero changes must occur
        verify(promotionStoreRepository, never()).deleteAllByPromotionId(any());
        verify(promotionProductRepository, never()).deleteAllByPromotionId(any());
        verify(promotionStoreRepository, never()).save(any());
        verify(promotionRepository, never()).saveAndFlush(any());
    }

    @Test
    void test60_updateDraftInsertionFailurePropagates() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "New Name", "New Desc", PromotionScopeType.STORE, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("15"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("2000000"), List.of(10), List.of(), 0
        );

        Promotion p = createValidPromotionBuilder().status(PromotionStatus.DRAFT).build();
        Store s = Store.builder().id(10).status(StoreStatus.APPROVED).build();

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(storeRepository.findAllById(any())).thenReturn(List.of(s));
        when(promotionStoreRepository.save(any())).thenThrow(new RuntimeException("DB Save Mapping Failure"));

        assertThrows(RuntimeException.class, () -> service.updateDraft(1, req));
    }

    @Test
    void test61_fundingSourcePlatformInvalidRatios() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("99"), new BigDecimal("1"), 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("nhà vườn không hợp lệ"));
    }

    @Test
    void test62_fundingSourceStoreInvalidRatios() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.STORE_FUNDED,
            new BigDecimal("1"), new BigDecimal("99"), 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("nền tảng không hợp lệ"));
    }

    @Test
    void test63_fundingSourceCoFundedInvalidRatios() {
        CreatePromotionRequest req = new CreatePromotionRequest(
            "Promo", "Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("10"), null, PromotionFundingSource.CO_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("1000000"), List.of(), List.of()
        );
        CustomException ex = assertThrows(CustomException.class, () -> service.createDraft(req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("phải lớn hơn 0 khi đồng tài trợ"));
    }

    @Test
    void test64_saveAndFlushSimulatedVersionIncrementReturned() {
        UpdatePromotionDraftRequest req = new UpdatePromotionDraftRequest(
            "New Name", "New Desc", PromotionScopeType.GLOBAL, PromotionDiscountType.PERCENTAGE,
            new BigDecimal("15"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100"), BigDecimal.ZERO, 0, new BigDecimal("2000000"), List.of(), List.of(), 5
        );
        Promotion p = createValidPromotionBuilder().status(PromotionStatus.DRAFT).version(5).build();
        Promotion flushedP = createValidPromotionBuilder().status(PromotionStatus.DRAFT).version(6).build(); // Simulate JPA version increment

        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(p));
        when(promotionRepository.saveAndFlush(any())).thenReturn(flushedP);

        PromotionDetailResponse resp = service.updateDraft(1, req);
        assertEquals(6, resp.version()); // Must return the post-flushed version
    }

    @Test
    void test65_auditHistorySaveFailurePropagates() {
        CreatePromotionRequest req = createValidRequest();
        Promotion p = createValidPromotionBuilder().build();

        when(promotionRepository.saveAndFlush(any())).thenReturn(p);
        when(promotionAuditHistoryRepository.save(any())).thenThrow(new RuntimeException("Audit Persistence Failure"));

        assertThrows(RuntimeException.class, () -> service.createDraft(req));
    }

    @Test
    void test66_negativeCountersRejectDetailResponse() {
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.ACTIVE)
            .budget(new BigDecimal("100000"))
            .reservedBudget(new BigDecimal("-10"))
            .consumedBudget(new BigDecimal("20000"))
            .build();

        when(promotionRepository.findById(1)).thenReturn(Optional.of(p));

        CustomException ex = assertThrows(CustomException.class, () -> service.getDetail(1));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ex.getStatus());
        assertTrue(ex.getMessage().contains("ngân sách không nhất quán"));
    }

    @Test
    void test67_negativeAvailableBudgetRejectsDetailResponse() {
        Promotion p = createValidPromotionBuilder()
            .status(PromotionStatus.ACTIVE)
            .budget(new BigDecimal("100000"))
            .reservedBudget(new BigDecimal("70000"))
            .consumedBudget(new BigDecimal("40000"))
            .build();

        when(promotionRepository.findById(1)).thenReturn(Optional.of(p));

        CustomException ex = assertThrows(CustomException.class, () -> service.getDetail(1));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ex.getStatus());
        assertTrue(ex.getMessage().contains("ngân sách khả dụng không nhất quán"));
    }
}
