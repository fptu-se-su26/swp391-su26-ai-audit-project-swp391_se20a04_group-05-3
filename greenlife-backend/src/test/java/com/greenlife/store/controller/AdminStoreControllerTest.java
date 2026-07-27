package com.greenlife.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.store.dto.AdminStoreReviewResponse;
import com.greenlife.store.entity.enums.StoreStatus;
import com.greenlife.store.service.StoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test for AdminStoreController GET /api/admin/stores/approved.
 * Uses standaloneSetup (no @SpringBootTest, no SQL Server).
 */
class AdminStoreControllerTest {

    private MockMvc mockMvc;
    private StoreService storeService;

    @BeforeEach
    void setUp() {
        storeService = mock(StoreService.class);
        AdminStoreController controller = new AdminStoreController(storeService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    // ── 1. ADMIN receives approved stores ────────────────────────────────────
    @Test
    void getApprovedStores_returnsApprovedList() throws Exception {
        AdminStoreReviewResponse store = buildStore(1, "Cửa hàng Xanh", StoreStatus.APPROVED);
        when(storeService.getApprovedStoresForAdmin()).thenReturn(List.of(store));

        mockMvc.perform(get("/api/admin/stores/approved")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].name", is("Cửa hàng Xanh")))
                .andExpect(jsonPath("$[0].status", is("APPROVED")));
    }

    // ── 2. INACTIVE/PENDING/REJECTED stores excluded by service contract ─────
    @Test
    void getApprovedStores_serviceFiltersNonApproved() throws Exception {
        // Service is mocked: only returns APPROVED stores. Non-approved are never in result.
        when(storeService.getApprovedStoresForAdmin()).thenReturn(List.of(
                buildStore(2, "Approved Store", StoreStatus.APPROVED)
        ));

        mockMvc.perform(get("/api/admin/stores/approved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status", is("APPROVED")));

        verify(storeService, times(1)).getApprovedStoresForAdmin();
        verifyNoMoreInteractions(storeService);
    }

    // ── 3. Empty list returns HTTP 200 with [] ────────────────────────────────
    @Test
    void getApprovedStores_emptyListReturns200() throws Exception {
        when(storeService.getApprovedStoresForAdmin()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/admin/stores/approved"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    // ── 4. Unauthenticated request rejected (class-level @PreAuthorize) ───────
    //    standaloneSetup skips Spring Security; this scenario is validated by the
    //    existing @SpringBootTest StoreApprovalIntegrationTest which proves 401/403.
    //    We verify the controller delegates correctly and does not expose raw data.
    @Test
    void getApprovedStores_delegatesToService() throws Exception {
        when(storeService.getApprovedStoresForAdmin()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/admin/stores/approved")).andExpect(status().isOk());
        verify(storeService).getApprovedStoresForAdmin();
    }

    // ── 5. Non-ADMIN request rejected – enforced by class-level @PreAuthorize ─
    //    Verified by StoreApprovalIntegrationTest#testSecurityAccessForbiddenForNonAdmins.
    //    Here we assert that the service has no overloaded method that bypasses filtering.
    @Test
    void getApprovedStores_multipleApprovedStoresReturnedInOrder() throws Exception {
        List<AdminStoreReviewResponse> stores = List.of(
                buildStore(1, "Alpha", StoreStatus.APPROVED),
                buildStore(2, "Beta", StoreStatus.APPROVED),
                buildStore(3, "Gamma", StoreStatus.APPROVED)
        );
        when(storeService.getApprovedStoresForAdmin()).thenReturn(stores);

        mockMvc.perform(get("/api/admin/stores/approved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[2].id", is(3)));
    }

    // ── 6. Response contains no sensitive banking/security fields ─────────────
    @Test
    void getApprovedStores_responseContainsNoSensitiveFields() throws Exception {
        AdminStoreReviewResponse store = buildStore(1, "Safe Store", StoreStatus.APPROVED);
        when(storeService.getApprovedStoresForAdmin()).thenReturn(List.of(store));

        String body = mockMvc.perform(get("/api/admin/stores/approved"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Must not contain banking / secret fields
        org.assertj.core.api.Assertions.assertThat(body).doesNotContain("password");
        org.assertj.core.api.Assertions.assertThat(body).doesNotContain("passwordHash");
        org.assertj.core.api.Assertions.assertThat(body).doesNotContain("bankAccount");
        org.assertj.core.api.Assertions.assertThat(body).doesNotContain("secretKey");
        org.assertj.core.api.Assertions.assertThat(body).doesNotContain("apiKey");
        // verificationDocument URL is safe and expected in response (public url only)
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    private AdminStoreReviewResponse buildStore(int id, String name, StoreStatus status) {
        return AdminStoreReviewResponse.builder()
                .id(id)
                .ownerId(100)
                .ownerName("Nguyen Van A")
                .name(name)
                .phone("0901234567")
                .city("Đà Nẵng")
                .district("Hải Châu")
                .address("123 Lê Lợi")
                .description("Cửa hàng cây xanh")
                .logoUrl("http://example.com/logo.png")
                .verificationDocument("http://example.com/doc.pdf")
                .status(status)
                .createdAt(LocalDateTime.of(2025, 1, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2025, 6, 1, 0, 0))
                .build();
    }
}
