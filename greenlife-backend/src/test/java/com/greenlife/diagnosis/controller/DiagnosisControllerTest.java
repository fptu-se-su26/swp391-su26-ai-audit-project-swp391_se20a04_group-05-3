package com.greenlife.diagnosis.controller;

import com.greenlife.diagnosis.service.DiagnosisService;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DiagnosisControllerTest {

    private DiagnosisService diagnosisService;
    private CurrentUserResolver currentUserResolver;
    private DiagnosisController diagnosisController;

    @BeforeEach
    void setUp() {
        diagnosisService = mock(DiagnosisService.class);
        currentUserResolver = mock(CurrentUserResolver.class);
        diagnosisController = new DiagnosisController(diagnosisService, currentUserResolver);
    }

    @Test
    void testDeleteDiagnosis_ControllerDelegatesAndReturns204() {
        Integer diagnosisId = 1;
        UserDetails userDetails = mock(UserDetails.class);
        User customer = User.builder().id(10).email("customer@test.com").build();

        when(currentUserResolver.resolveUser(userDetails)).thenReturn(customer);

        ResponseEntity<Void> response = diagnosisController.deleteDiagnosis(diagnosisId, userDetails);

        verify(currentUserResolver, times(1)).resolveUser(userDetails);
        verify(diagnosisService, times(1)).deleteDiagnosisForCustomer(diagnosisId, customer);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void testCreateDiagnosis_PassesUserContextToService() {
        UserDetails userDetails = mock(UserDetails.class);
        User customer = User.builder().id(10).email("customer@test.com").build();
        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);
        com.greenlife.diagnosis.entity.DiagnosisHistory mockHistory = com.greenlife.diagnosis.entity.DiagnosisHistory.builder().id(1).userContext("Test context").build();
        com.greenlife.diagnosis.dto.DiagnosisResponse mockResponse = com.greenlife.diagnosis.dto.DiagnosisResponse.builder().id(1).userContext("Test context").build();

        when(currentUserResolver.resolveUser(userDetails)).thenReturn(customer);
        when(diagnosisService.createDiagnosis(customer, mockFile, 5, "Test context")).thenReturn(mockHistory);
        when(diagnosisService.convertToResponse(mockHistory, true)).thenReturn(mockResponse);

        ResponseEntity<com.greenlife.diagnosis.dto.DiagnosisResponse> response = diagnosisController.createDiagnosis(mockFile, 5, "Test context", userDetails);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Test context", response.getBody().getUserContext());
        verify(diagnosisService, times(1)).createDiagnosis(customer, mockFile, 5, "Test context");
    }

    @Test
    void testCreateDiagnosis_AllowsStoreOwner() {
        UserDetails userDetails = mock(UserDetails.class);
        User storeOwner = User.builder().id(20).email("seller@test.com").build();
        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);
        com.greenlife.diagnosis.entity.DiagnosisHistory mockHistory = com.greenlife.diagnosis.entity.DiagnosisHistory.builder().id(2).userContext("Seller plant context").build();
        com.greenlife.diagnosis.dto.DiagnosisResponse mockResponse = com.greenlife.diagnosis.dto.DiagnosisResponse.builder().id(2).userContext("Seller plant context").build();

        when(currentUserResolver.resolveUser(userDetails)).thenReturn(storeOwner);
        when(diagnosisService.createDiagnosis(storeOwner, mockFile, null, "Seller plant context")).thenReturn(mockHistory);
        when(diagnosisService.convertToResponse(mockHistory, true)).thenReturn(mockResponse);

        ResponseEntity<com.greenlife.diagnosis.dto.DiagnosisResponse> response = diagnosisController.createDiagnosis(mockFile, null, "Seller plant context", userDetails);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Seller plant context", response.getBody().getUserContext());
        verify(diagnosisService, times(1)).createDiagnosis(storeOwner, mockFile, null, "Seller plant context");
    }

    @Test
    void testGetMyDiagnoses_AllowsCustomerAndStoreOwner() {
        UserDetails userDetails = mock(UserDetails.class);
        User storeOwner = User.builder().id(20).email("seller@test.com").build();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        org.springframework.data.domain.Page<com.greenlife.diagnosis.entity.DiagnosisHistory> mockPage = new org.springframework.data.domain.PageImpl<>(java.util.List.of());

        when(currentUserResolver.resolveUser(userDetails)).thenReturn(storeOwner);
        when(diagnosisService.getCustomerDiagnoses(storeOwner.getId(), null, null, pageable)).thenReturn(mockPage);

        ResponseEntity<org.springframework.data.domain.Page<com.greenlife.diagnosis.dto.DiagnosisResponse>> response = diagnosisController.getMyDiagnoses(null, null, pageable, userDetails);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(diagnosisService, times(1)).getCustomerDiagnoses(20, null, null, pageable);
    }

    @Test
    void testPreAuthorizeAnnotations_AllowCustomerAndStoreOwnerOnly() throws NoSuchMethodException {
        // 1. POST /api/diagnoses (createDiagnosis)
        java.lang.reflect.Method createMethod = DiagnosisController.class.getMethod("createDiagnosis", org.springframework.web.multipart.MultipartFile.class, Integer.class, String.class, UserDetails.class);
        assertTrue(createMethod.isAnnotationPresent(org.springframework.security.access.prepost.PreAuthorize.class));
        String createAuth = createMethod.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class).value();
        assertTrue(createAuth.contains("CUSTOMER"), "createDiagnosis must allow CUSTOMER");
        assertTrue(createAuth.contains("STORE_OWNER"), "createDiagnosis must allow STORE_OWNER");
        assertFalse(createAuth.contains("ADMIN"), "createDiagnosis must not expand to ADMIN");

        // 2. GET /api/diagnoses (getMyDiagnoses)
        java.lang.reflect.Method getMyMethod = DiagnosisController.class.getMethod("getMyDiagnoses", Integer.class, com.greenlife.diagnosis.entity.enums.Severity.class, org.springframework.data.domain.Pageable.class, UserDetails.class);
        assertTrue(getMyMethod.isAnnotationPresent(org.springframework.security.access.prepost.PreAuthorize.class));
        String getMyAuth = getMyMethod.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class).value();
        assertTrue(getMyAuth.contains("CUSTOMER"), "getMyDiagnoses must allow CUSTOMER");
        assertTrue(getMyAuth.contains("STORE_OWNER"), "getMyDiagnoses must allow STORE_OWNER");
        assertFalse(getMyAuth.contains("ADMIN"), "getMyDiagnoses must not expand to ADMIN");

        // 3. GET /api/diagnoses/{id} (getDiagnosisDetails)
        java.lang.reflect.Method getDetailsMethod = DiagnosisController.class.getMethod("getDiagnosisDetails", Integer.class, UserDetails.class);
        assertTrue(getDetailsMethod.isAnnotationPresent(org.springframework.security.access.prepost.PreAuthorize.class));
        assertEquals("isAuthenticated()", getDetailsMethod.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class).value());
    }
}
