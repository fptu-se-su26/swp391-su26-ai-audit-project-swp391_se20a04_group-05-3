package com.greenlife.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.ai.service.GeminiProviderService;
import com.greenlife.chat.dto.GeminiChatResult;
import com.greenlife.diagnosis.dto.DiagnosisResult;
import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.exception.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GeminiProviderServiceTest {

    private GeminiProviderService service;
    private MockRestServiceServer mockServer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        service = new GeminiProviderService(objectMapper, builder);

        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "apiKey", "test-secret-key-123");
        ReflectionTestUtils.setField(service, "model", "gemini-1.5-flash");
        ReflectionTestUtils.setField(service, "timeoutSeconds", 15);
        ReflectionTestUtils.setField(service, "restClient", restClient);
    }

    @Test
    void testClassifyImage_Success() throws Exception {
        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\n  \\\"plantName\\\": \\\"Cây Sen Đá\\\",\\n  \\\"diseaseName\\\": \\\"Thối gốc rễ\\\",\\n  \\\"confidenceScore\\\": 92.50,\\n  \\\"severity\\\": \\\"HIGH\\\",\\n  \\\"result\\\":\\\"Thối rễ do úng nước\\\",\\n  \\\"recommendation\\\":\\\"Cách ly cây bệnh, hạn chế tưới nước\\\",\\n  \\\"observedSymptoms\\\":\\\"Thân sát đất bị úa đen\\\",\\n  \\\"possibleCauses\\\":\\\"Nấm tấn công trong đất quá ẩm\\\",\\n  \\\"alternativeDiagnoses\\\":[\\\"Nhiễm nấm Fusarium\\\"],\\n  \\\"treatmentSteps\\\":[\\\"Cắt bỏ rễ thối\\\",\\\"Phơi khô rễ\\\"],\\n  \\\"preventionSteps\\\":[\\\"Sử dụng đất tơi xốp\\\"],\\n  \\\"urgentWarning\\\":\\\"Cần xử lý ngay để tránh thối toàn bộ cây\\\",\\n  \\\"disclaimer\\\":\\\"Kết quả chỉ mang tính tham khảo\\\",\\n  \\\"keywords\\\":[\\\"thuốc diệt nấm\\\",\\\"đất sen đá\\\"]\\n}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "test-secret-key-123"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andRespond(withSuccess(mockGeminiResponse, MediaType.APPLICATION_JSON));

        byte[] dummyBytes = new byte[]{1, 2, 3};
        DiagnosisResult result = service.classifyImage(dummyBytes, "image/png");

        assertNotNull(result);
        assertEquals("Cây Sen Đá", result.getPlantName());
        assertEquals("Thối gốc rễ", result.getDiseaseName());
        assertEquals(0, new BigDecimal("92.5").compareTo(result.getConfidenceScore()));
        assertEquals(Severity.HIGH, result.getSeverity());
        assertEquals("Thối rễ do úng nước", result.getResult());
        assertEquals("Cách ly cây bệnh, hạn chế tưới nước", result.getRecommendation());
        assertEquals("Thân sát đất bị úa đen", result.getObservedSymptoms());
        assertEquals("Nấm tấn công trong đất quá ẩm", result.getPossibleCauses());
        assertEquals(List.of("Nhiễm nấm Fusarium"), result.getAlternativeDiagnoses());
        assertEquals(List.of("Cắt bỏ rễ thối", "Phơi khô rễ"), result.getTreatmentSteps());
        assertEquals(List.of("Sử dụng đất tơi xốp"), result.getPreventionSteps());
        assertEquals("Cần xử lý ngay để tránh thối toàn bộ cây", result.getUrgentWarning());
        assertEquals("Kết quả chỉ mang tính tham khảo", result.getDisclaimer());
        assertEquals(List.of("thuốc diệt nấm", "đất sen đá"), result.getKeywords());

        mockServer.verify();
    }

    @Test
    void testGenerateChat_Success() throws Exception {
        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\n  \\\"answer\\\": \\\"Xin chào! Tôi là trợ lý ảo.\\\",\\n  \\\"suggestedActionIds\\\": [\\\"nav_shop\\\", \\\"nav_booking\\\"]\\n}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "test-secret-key-123"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andRespond(withSuccess(mockGeminiResponse, MediaType.APPLICATION_JSON));

        GeminiChatResult result = service.generateChat("Instruction", "Question");

        assertNotNull(result);
        assertEquals("Xin chào! Tôi là trợ lý ảo.", result.getAnswer());
        assertEquals(List.of("nav_shop", "nav_booking"), result.getSuggestedActionIds());

        mockServer.verify();
    }

    @Test
    void testClassifyImage_AiDisabled() {
        ReflectionTestUtils.setField(service, "enabled", false);

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
    }

    @Test
    void testClassifyImage_MissingModel() {
        ReflectionTestUtils.setField(service, "model", "");

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
    }

    @Test
    void testClassifyImage_MissingApiKey() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertFalse(exception.getMessage().contains("test-secret-key-123"));
    }

    @Test
    void testClassifyImage_InvalidJsonFromGemini() {
        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"invalid json syntax here\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"))
                .andExpect(header("x-goog-api-key", "test-secret-key-123"))
                .andRespond(withSuccess(mockGeminiResponse, MediaType.APPLICATION_JSON));

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatus());
    }

    @Test
    void testClassifyImage_QuotaExceeded_503() {
        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"))
                .andExpect(header("x-goog-api-key", "test-secret-key-123"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertTrue(exception.getMessage().contains("hạn mức"));
    }

    @Test
    void testClassifyImage_ProviderError_503() {
        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"))
                .andExpect(header("x-goog-api-key", "test-secret-key-123"))
                .andRespond(withServerError());

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
    }

    @Test
    void testClassifyImage_MissingRequiredJsonFields() {
        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\n  \\\"diseaseName\\\": \\\"Thối gốc rễ\\\",\\n  \\\"confidenceScore\\\": 92.50,\\n  \\\"severity\\\": \\\"HIGH\\\"\\n}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"))
                .andExpect(header("x-goog-api-key", "test-secret-key-123"))
                .andRespond(withSuccess(mockGeminiResponse, MediaType.APPLICATION_JSON));

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatus());
        assertTrue(exception.getMessage().contains("Tên cây cảnh bị thiếu"));
    }

    @Test
    void testClassifyImage_ApiKeySanitization() {
        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"))
                .andExpect(header("x-goog-api-key", "test-secret-key-123"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        CustomException exception = assertThrows(CustomException.class, () -> {
            service.classifyImage(new byte[]{1}, "image/jpeg");
        });

        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatus());
        assertFalse(exception.getMessage().contains("test-secret-key-123"));
    }
}
