package com.greenlife.store.controller;

import com.greenlife.auth.service.AuthService;
import com.greenlife.store.dto.PublicStoreResponse;
import com.greenlife.store.service.StoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StoreControllerTest {

    private MockMvc mockMvc;
    private StoreService storeService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        storeService = mock(StoreService.class);
        authService = mock(AuthService.class);
        StoreController controller = new StoreController(storeService, authService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getPublicApprovedStores_returns200AndApprovedStores() throws Exception {
        PublicStoreResponse store = PublicStoreResponse.builder()
                .id(1)
                .name("Vườn Nhà Long")
                .city("Đà Nẵng")
                .district("Xã Hòa Vang")
                .address("Xã Hòa Vang, Đà Nẵng")
                .build();

        when(storeService.getPublicApprovedStores()).thenReturn(List.of(store));

        mockMvc.perform(get("/api/stores/public")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].name", is("Vườn Nhà Long")))
                .andExpect(jsonPath("$[0].city", is("Đà Nẵng")))
                .andExpect(jsonPath("$[0].district", is("Xã Hòa Vang")))
                .andExpect(jsonPath("$[0].phone").doesNotExist())
                .andExpect(jsonPath("$[0].ownerEmail").doesNotExist())
                .andExpect(jsonPath("$[0].bankAccount").doesNotExist())
                .andExpect(jsonPath("$[0].kyc").doesNotExist())
                .andExpect(jsonPath("$[0].rejectionReason").doesNotExist())
                .andExpect(jsonPath("$[0].verificationDocument").doesNotExist())
                .andExpect(jsonPath("$[0].cccdFrontUrl").doesNotExist());
    }

    @Test
    void getPublicApprovedStores_emptyListReturns200() throws Exception {
        when(storeService.getPublicApprovedStores()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/stores/public"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
