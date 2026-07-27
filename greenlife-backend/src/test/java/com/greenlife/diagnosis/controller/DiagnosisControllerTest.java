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
}
