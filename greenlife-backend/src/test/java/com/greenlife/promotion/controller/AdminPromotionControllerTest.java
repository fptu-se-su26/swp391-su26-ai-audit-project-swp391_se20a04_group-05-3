package com.greenlife.promotion.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.exception.CustomException;
import com.greenlife.promotion.dto.*;
import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import com.greenlife.promotion.service.PromotionAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminPromotionControllerTest {

    private MockMvc mockMvc;
    private PromotionAdminService promotionAdminService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        promotionAdminService = mock(PromotionAdminService.class);
        AdminPromotionController controller = new AdminPromotionController(promotionAdminService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCreateDraftSuccess() throws Exception {
        CreatePromotionRequest request = new CreatePromotionRequest(
            "Chiến dịch Hè",
            "Mô tả hè",
            PromotionScopeType.GLOBAL,
            PromotionDiscountType.FIXED,
            new BigDecimal("20000"),
            null,
            PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"),
            new BigDecimal("0.00"),
            10,
            new BigDecimal("10000000"),
            Collections.emptyList(),
            Collections.emptyList()
        );

        PromotionDetailResponse response = new PromotionDetailResponse(
            1, "Chiến dịch Hè", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            new BigDecimal("20000"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 10, new BigDecimal("10000000"),
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("10000000"), PromotionStatus.DRAFT,
            0, LocalDateTime.now(), null, null, "Mô tả hè", BigDecimal.ZERO, null, null, null, null,
            Collections.emptyList(), Collections.emptyList(), Collections.emptyList()
        );

        when(promotionAdminService.createDraft(any(CreatePromotionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/admin/promotions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Chiến dịch Hè"));
    }

    @Test
    void testCreateDraftValidationFailure() throws Exception {
        // Name blank is invalid
        CreatePromotionRequest request = new CreatePromotionRequest(
            "   ",
            "Mô tả hè",
            PromotionScopeType.GLOBAL,
            PromotionDiscountType.FIXED,
            new BigDecimal("20000"),
            null,
            PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"),
            new BigDecimal("0.00"),
            10,
            new BigDecimal("10000000"),
            Collections.emptyList(),
            Collections.emptyList()
        );

        mockMvc.perform(post("/api/admin/promotions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateDraftSuccess() throws Exception {
        UpdatePromotionDraftRequest request = new UpdatePromotionDraftRequest(
            "Chiến dịch Thu",
            "Mô tả thu",
            PromotionScopeType.GLOBAL,
            PromotionDiscountType.FIXED,
            new BigDecimal("30000"),
            null,
            PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"),
            new BigDecimal("0.00"),
            5,
            new BigDecimal("5000000"),
            Collections.emptyList(),
            Collections.emptyList(),
            0
        );

        PromotionDetailResponse response = new PromotionDetailResponse(
            1, "Chiến dịch Thu", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            new BigDecimal("30000"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 5, new BigDecimal("5000000"),
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("5000000"), PromotionStatus.DRAFT,
            1, LocalDateTime.now(), null, null, "Mô tả thu", BigDecimal.ZERO, null, null, null, null,
            Collections.emptyList(), Collections.emptyList(), Collections.emptyList()
        );

        when(promotionAdminService.updateDraft(eq(1), any(UpdatePromotionDraftRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/admin/promotions/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Chiến dịch Thu"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void testActivateSuccess() throws Exception {
        PromotionActionRequest request = new PromotionActionRequest("Kích hoạt chiến dịch", 0);
        PromotionDetailResponse response = new PromotionDetailResponse(
            1, "Chiến dịch Thu", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            new BigDecimal("30000"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 5, new BigDecimal("5000000"),
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("5000000"), PromotionStatus.ACTIVE,
            1, LocalDateTime.now(), LocalDateTime.now(), null, "Mô tả thu", BigDecimal.ZERO, null, null, null, null,
            Collections.emptyList(), Collections.emptyList(), Collections.emptyList()
        );

        when(promotionAdminService.activate(eq(1), any(PromotionActionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/admin/promotions/1/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testEndSuccess() throws Exception {
        PromotionActionRequest request = new PromotionActionRequest("Kết thúc sớm", 1);
        PromotionDetailResponse response = new PromotionDetailResponse(
            1, "Chiến dịch Thu", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            new BigDecimal("30000"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 5, new BigDecimal("5000000"),
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("5000000"), PromotionStatus.ENDED,
            2, LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), "Mô tả thu", BigDecimal.ZERO, null, null, null, "Kết thúc sớm",
            Collections.emptyList(), Collections.emptyList(), Collections.emptyList()
        );

        when(promotionAdminService.end(eq(1), any(PromotionActionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/admin/promotions/1/end")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENDED"));
    }

    @Test
    void testCancelSuccess() throws Exception {
        PromotionActionRequest request = new PromotionActionRequest("Hủy bỏ", 0);
        PromotionDetailResponse response = new PromotionDetailResponse(
            1, "Chiến dịch Thu", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            new BigDecimal("30000"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 5, new BigDecimal("5000000"),
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("5000000"), PromotionStatus.CANCELLED,
            1, LocalDateTime.now(), null, null, "Mô tả thu", BigDecimal.ZERO, null, null, null, null,
            Collections.emptyList(), Collections.emptyList(), Collections.emptyList()
        );

        when(promotionAdminService.cancel(eq(1), any(PromotionActionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/admin/promotions/1/cancel")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void testListSuccess() throws Exception {
        PromotionSummaryResponse summary = new PromotionSummaryResponse(
            1, "Chiến dịch Thu", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            new BigDecimal("30000"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 5, new BigDecimal("5000000"),
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("5000000"), PromotionStatus.ACTIVE,
            1, LocalDateTime.now(), LocalDateTime.now(), null
        );

        PageRequest pageRequest = PageRequest.of(0, 10);
        when(promotionAdminService.list(eq(PromotionStatus.ACTIVE), eq(PromotionScopeType.GLOBAL), any()))
            .thenReturn(new PageImpl<>(List.of(summary), pageRequest, 1));

        mockMvc.perform(get("/api/admin/promotions")
                .param("status", "ACTIVE")
                .param("scopeType", "GLOBAL")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Chiến dịch Thu"));
    }

    @Test
    void testGetDetailSuccess() throws Exception {
        PromotionDetailResponse response = new PromotionDetailResponse(
            1, "Chiến dịch Thu", PromotionScopeType.GLOBAL, PromotionDiscountType.FIXED,
            new BigDecimal("30000"), null, PromotionFundingSource.PLATFORM_FUNDED,
            new BigDecimal("100.00"), new BigDecimal("0.00"), 5, new BigDecimal("5000000"),
            BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("5000000"), PromotionStatus.DRAFT,
            1, LocalDateTime.now(), null, null, "Mô tả thu", BigDecimal.ZERO, null, null, null, null,
            Collections.emptyList(), Collections.emptyList(), Collections.emptyList()
        );

        when(promotionAdminService.getDetail(eq(1))).thenReturn(response);

        mockMvc.perform(get("/api/admin/promotions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Chiến dịch Thu"));
    }
}
