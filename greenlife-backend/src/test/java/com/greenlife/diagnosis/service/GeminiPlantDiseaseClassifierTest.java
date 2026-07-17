package com.greenlife.diagnosis.service;

import com.greenlife.ai.service.GeminiProviderService;
import com.greenlife.diagnosis.dto.DiagnosisResult;
import com.greenlife.exception.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GeminiPlantDiseaseClassifierTest {

    private GeminiProviderService geminiProviderService;
    private GeminiPlantDiseaseClassifier classifier;

    @BeforeEach
    void setUp() {
        geminiProviderService = mock(GeminiProviderService.class);
        classifier = new GeminiPlantDiseaseClassifier(geminiProviderService);
    }

    @Test
    void testClassify_JpegSuccess() {
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01};
        DiagnosisResult mockResult = DiagnosisResult.builder()
                .diseaseName("Cây khỏe mạnh")
                .build();

        when(geminiProviderService.classifyImage(any(), any())).thenReturn(mockResult);

        DiagnosisResult result = classifier.classify("test.jpg", jpegBytes);
        assertNotNull(result);
        assertEquals("Cây khỏe mạnh", result.getDiseaseName());
        verify(geminiProviderService, times(1)).classifyImage(jpegBytes, "image/jpeg");
    }

    @Test
    void testClassify_PngSuccess() {
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        DiagnosisResult mockResult = DiagnosisResult.builder()
                .diseaseName("Thối rễ")
                .build();

        when(geminiProviderService.classifyImage(any(), any())).thenReturn(mockResult);

        DiagnosisResult result = classifier.classify("test.png", pngBytes);
        assertNotNull(result);
        assertEquals("Thối rễ", result.getDiseaseName());
        verify(geminiProviderService, times(1)).classifyImage(pngBytes, "image/png");
    }

    @Test
    void testClassify_WebpSuccess() {
        byte[] webpBytes = new byte[12];
        webpBytes[0] = (byte) 0x52; // R
        webpBytes[1] = (byte) 0x49; // I
        webpBytes[2] = (byte) 0x46; // F
        webpBytes[3] = (byte) 0x46; // F
        webpBytes[8] = (byte) 0x57; // W
        webpBytes[9] = (byte) 0x45; // E
        webpBytes[10] = (byte) 0x42; // B
        webpBytes[11] = (byte) 0x50; // P

        DiagnosisResult mockResult = DiagnosisResult.builder()
                .diseaseName("Đốm lá")
                .build();

        when(geminiProviderService.classifyImage(any(), any())).thenReturn(mockResult);

        DiagnosisResult result = classifier.classify("test.webp", webpBytes);
        assertNotNull(result);
        assertEquals("Đốm lá", result.getDiseaseName());
        verify(geminiProviderService, times(1)).classifyImage(webpBytes, "image/webp");
    }

    @Test
    void testClassify_MismatchedExtension() {
        // PNG bytes but JPG filename extension
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
        
        CustomException exception = assertThrows(CustomException.class, () -> {
            classifier.classify("test.jpg", pngBytes);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("khớp với nội dung"));
        verifyNoInteractions(geminiProviderService);
    }

    @Test
    void testClassify_UnsupportedBytes() {
        byte[] randomBytes = new byte[]{1, 2, 3, 4, 5};
        
        CustomException exception = assertThrows(CustomException.class, () -> {
            classifier.classify("test.png", randomBytes);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("không được hỗ trợ"));
        verifyNoInteractions(geminiProviderService);
    }

    @Test
    void testClassify_EmptyBytes() {
        CustomException exception = assertThrows(CustomException.class, () -> {
            classifier.classify("test.png", new byte[0]);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("trống"));
        verifyNoInteractions(geminiProviderService);
    }
}
