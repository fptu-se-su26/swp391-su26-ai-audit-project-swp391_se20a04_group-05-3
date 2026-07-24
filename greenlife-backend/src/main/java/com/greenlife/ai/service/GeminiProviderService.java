package com.greenlife.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlife.chat.dto.GeminiChatResult;
import com.greenlife.diagnosis.dto.DiagnosisResult;
import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.diagnosis.service.RecommendationCategoryNormalizer;
import com.greenlife.exception.CustomException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiProviderService {

    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;
    private RestClient restClient;

    @Value("${greenlife.ai.enabled:false}")
    private boolean enabled;

    @Value("${greenlife.ai.gemini-api-key:}")
    private String apiKey;

    @Value("${greenlife.ai.gemini-model:}")
    private String model;

    @Value("${greenlife.ai.request-timeout-seconds:15}")
    private int timeoutSeconds;

    public GeminiProviderService(ObjectMapper objectMapper, RestClient.Builder restClientBuilder) {
        this.objectMapper = objectMapper;
        this.restClientBuilder = restClientBuilder;
    }

    @PostConstruct
    public void init() {
        if (this.restClient == null) {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(timeoutSeconds * 1000);
            requestFactory.setReadTimeout(timeoutSeconds * 1000);
            this.restClient = restClientBuilder.requestFactory(requestFactory).build();
        }
    }

    public String getModelName() {
        return model;
    }

    public DiagnosisResult classifyImage(byte[] imageBytes, String mimeType) {
        if (!enabled) {
            throw new CustomException("Dịch vụ AI chẩn đoán chưa được kích hoạt.", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (model == null || model.isBlank()) {
            throw new CustomException("Cấu hình dịch vụ AI chưa đầy đủ (thiếu model).", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new CustomException("Cấu hình dịch vụ AI chưa đầy đủ (thiếu API key).", HttpStatus.SERVICE_UNAVAILABLE);
        }

        String systemInstruction = "Bạn là một chuyên gia thực vật học và bác sĩ cây cảnh chuyên nghiệp của GreenLife.\n" +
                "Nhiệm vụ của bạn là phân tích hình ảnh lá hoặc bộ phận cây bị bệnh được cung cấp để chẩn đoán tình trạng sức khỏe của cây.\n" +
                "Hãy trả về một kết quả chẩn đoán chính xác bằng tiếng Việt dưới định dạng JSON có cấu trúc như sau:\n" +
                "{\n" +
                "  \"plantName\": \"Tên loại cây cảnh (ví dụ: Cây Trầu Bà, Cây Sen Đá, ...)\",\n" +
                "  \"diseaseName\": \"Tên bệnh hại phát hiện được (nếu cây khỏe mạnh, ghi 'Cây khỏe mạnh')\",\n" +
                "  \"confidenceScore\": 95.50,\n" +
                "  \"severity\": \"LOW\" hoặc \"MEDIUM\" hoặc \"HIGH\" hoặc \"CRITICAL\",\n" +
                "  \"result\": \"Mô tả chi tiết các triệu chứng quan sát thấy trên cây bệnh\",\n" +
                "  \"recommendation\": \"Khuyến nghị chăm sóc hoặc giải pháp tổng quan ban đầu\",\n" +
                "  \"observedSymptoms\": \"Danh sách các triệu chứng cụ thể quan sát thấy\",\n" +
                "  \"possibleCauses\": \"Các nguyên nhân có thể gây ra tình trạng này\",\n" +
                "  \"alternativeDiagnoses\": [\"Các chẩn đoán thay thế khả thi khác nếu có\"],\n" +
                "  \"treatmentSteps\": [\"Bước 1: ...\", \"Bước 2: ...\"],\n" +
                "  \"preventionSteps\": [\"Bước 1: ...\", \"Bước 2: ...\"],\n" +
                "  \"urgentWarning\": \"Cảnh báo khẩn cấp nếu bệnh có nguy cơ lây lan nhanh hoặc làm chết cây\",\n" +
                "  \"disclaimer\": \"Tuyên bố miễn trừ trách nhiệm: Kết quả phân tích hình ảnh chỉ mang tính tham khảo và không thay thế cho việc chẩn đoán trực tiếp của chuyên gia nông nghiệp.\",\n" +
                "  \"keywords\": [\"từ khóa 1\", \"từ khóa 2\", \"từ khóa 3\"],\n" +
                "  \"diagnosable\": true hoặc false,\n" +
                "  \"uncertaintyReason\": \"Lý do nếu không thể chẩn đoán hoặc độ tin cậy thấp\",\n" +
                "  \"recommendationCategories\": [\"PEST_CONTROL\", \"NUTRITION_AND_FERTILIZATION\"]\n" +
                "}\n\n" +
                "Lưu ý quan trọng:\n" +
                "1. Một hình ảnh đơn lẻ có thể không đủ để đưa ra kết luận chắc chắn. Không tự bịa đặt thông tin nếu không có độ tin cậy cao.\n" +
                "2. Nếu hình ảnh không chứa cây cảnh hoặc không thể nhận diện được bộ phận cây bị bệnh, hãy trả về JSON với \"diagnosable\": false, \"diseaseName\": \"Không thể nhận diện\", \"confidenceScore\": 0.00, \"severity\": \"LOW\", \"result\": \"Hình ảnh không rõ ràng hoặc không chứa cây cảnh để chẩn đoán.\", \"uncertaintyReason\": \"Hình ảnh không chứa cây cảnh hoặc chất lượng ảnh quá kém\"\n" +
                "3. Không khuyên dùng các loại hóa chất cấm, độc hại hoặc chưa được kiểm chứng. Ưu tiên các biện pháp tự nhiên, sinh học và an toàn.\n" +
                "4. Giá trị của \"recommendationCategories\" chỉ được phép chọn từ danh sách sau: PLANT_HEALTH_INSPECTION, EXPERT_CONSULTATION, PEST_CONTROL, FUNGAL_DISEASE_CARE, NUTRITION_AND_FERTILIZATION, WATERING_AND_DRAINAGE, SOIL_AND_ROOT_CARE, PRUNING_AND_RECOVERY, GENERAL_PLANT_CARE. Không thêm các giá trị khác ngoài danh sách này.\n" +
                "5. Nếu \"diagnosable\" là false, \"diseaseName\" KHÔNG ĐƯỢC chứa tên bệnh cụ thể nào.\n" +
                "6. Trả về kết quả CHỈ là chuỗi JSON hợp lệ, không chứa các ký tự định dạng markdown như ```json hoặc ``` ở đầu và cuối.";

        log.info("Sending plant disease diagnosis request to Gemini provider using model: {}", model);

        String base64Data = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> textPart = Map.of("text", systemInstruction);
        Map<String, Object> inlineData = Map.of(
                "mimeType", mimeType,
                "data", base64Data
        );
        Map<String, Object> imagePart = Map.of("inlineData", inlineData);
        Map<String, Object> parts = Map.of("parts", List.of(textPart, imagePart));
        
        Map<String, Object> payload = Map.of(
                "contents", List.of(parts),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json"
                )
        );

        String uri = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", model);

        try {
            String responseJson = restClient.post()
                    .uri(uri)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (responseJson == null || responseJson.isBlank()) {
                throw new CustomException("Nhận phản hồi rỗng từ dịch vụ AI chẩn đoán.", HttpStatus.BAD_GATEWAY);
            }

            Map<String, Object> responseMap = objectMapper.readValue(responseJson, new TypeReference<Map<String, Object>>() {});
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new CustomException("Không tìm thấy kết quả phân tích phù hợp từ dịch vụ AI chẩn đoán.", HttpStatus.BAD_GATEWAY);
            }

            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            if (content == null) {
                throw new CustomException("Nội dung kết quả phân tích bị trống từ dịch vụ AI.", HttpStatus.BAD_GATEWAY);
            }

            List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
            if (responseParts == null || responseParts.isEmpty()) {
                throw new CustomException("Cấu trúc kết quả phân tích bị trống từ dịch vụ AI.", HttpStatus.BAD_GATEWAY);
            }

            String text = (String) responseParts.get(0).get("text");
            if (text == null || text.isBlank()) {
                throw new CustomException("Kết quả văn bản chẩn đoán bị trống từ dịch vụ AI.", HttpStatus.BAD_GATEWAY);
            }

            text = text.trim();
            if (text.startsWith("```")) {
                int firstNewline = text.indexOf('\n');
                int lastBackticks = text.lastIndexOf("```");
                if (firstNewline != -1 && lastBackticks != -1 && lastBackticks > firstNewline) {
                    text = text.substring(firstNewline + 1, lastBackticks).trim();
                }
            }

            DiagnosisResult result = objectMapper.readValue(text, DiagnosisResult.class);
            validateAndNormalizeResult(result);
            return result;

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logSanitizedError("Gemini provider HTTP error status: " + e.getStatusCode(), e);
            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                throw new CustomException("Dịch vụ AI chẩn đoán tạm thời hết hạn mức cuộc gọi. Vui lòng quay lại sau.", HttpStatus.SERVICE_UNAVAILABLE);
            }
            if (e.getStatusCode().is5xxServerError()) {
                throw new CustomException("Dịch vụ AI chẩn đoán gặp sự cố hệ thống. Vui lòng thử lại sau.", HttpStatus.SERVICE_UNAVAILABLE);
            }
            throw new CustomException("Yêu cầu chẩn đoán bị từ chối hoặc không hợp lệ từ dịch vụ AI.", HttpStatus.BAD_GATEWAY);
        } catch (RestClientException e) {
            logSanitizedError("Gemini provider network request failed", e);
            if (e.getCause() instanceof java.net.SocketTimeoutException || e.getMessage().contains("timed out") || e.getMessage().contains("Timeout")) {
                throw new CustomException("Kết nối tới hệ thống AI chẩn đoán bị quá thời hạn (timeout). Vui lòng thử lại.", HttpStatus.GATEWAY_TIMEOUT);
            }
            throw new CustomException("Không thể kết nối tới dịch vụ AI chẩn đoán. Vui lòng thử lại sau.", HttpStatus.SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            logSanitizedError("Error processing AI diagnosis response", e);
            if (e instanceof CustomException) {
                throw (CustomException) e;
            }
            throw new CustomException("Lỗi định dạng kết quả chẩn đoán nhận được từ hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
    }

    public GeminiChatResult generateChat(String systemInstruction, String question) {
        if (!enabled) {
            throw new CustomException("Dịch vụ trợ lý AI chưa được kích hoạt.", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (model == null || model.isBlank()) {
            throw new CustomException("Cấu hình dịch vụ trợ lý AI chưa đầy đủ (thiếu model).", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new CustomException("Cấu hình dịch vụ trợ lý AI chưa đầy đủ (thiếu API key).", HttpStatus.SERVICE_UNAVAILABLE);
        }

        log.info("Sending chat request to Gemini provider using model: {}", model);

        Map<String, Object> systemPart = Map.of("text", systemInstruction);
        Map<String, Object> userPart = Map.of("text", question);
        Map<String, Object> parts = Map.of("parts", List.of(systemPart, userPart));
        
        Map<String, Object> schema = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                "answer", Map.of(
                    "type", "STRING"
                ),
                "suggestedActionIds", Map.of(
                    "type", "ARRAY",
                    "items", Map.of("type", "STRING")
                )
            ),
            "required", List.of("answer", "suggestedActionIds")
        );

        Map<String, Object> payload = Map.of(
                "contents", List.of(parts),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseSchema", schema
                )
        );

        String uri = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", model);

        try {
            String responseJson = restClient.post()
                    .uri(uri)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (responseJson == null || responseJson.isBlank()) {
                throw new CustomException("Nhận phản hồi rỗng từ dịch vụ trợ lý AI.", HttpStatus.BAD_GATEWAY);
            }

            Map<String, Object> responseMap = objectMapper.readValue(responseJson, new TypeReference<Map<String, Object>>() {});
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new CustomException("Không tìm thấy kết quả phù hợp từ dịch vụ trợ lý AI.", HttpStatus.BAD_GATEWAY);
            }

            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            if (content == null) {
                throw new CustomException("Nội dung kết quả bị trống từ dịch vụ trợ lý AI.", HttpStatus.BAD_GATEWAY);
            }

            List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
            if (responseParts == null || responseParts.isEmpty()) {
                throw new CustomException("Cấu trúc kết quả bị trống từ dịch vụ trợ lý AI.", HttpStatus.BAD_GATEWAY);
            }

            String text = (String) responseParts.get(0).get("text");
            if (text == null || text.isBlank()) {
                throw new CustomException("Nội dung phản hồi bị trống từ dịch vụ trợ lý AI.", HttpStatus.BAD_GATEWAY);
            }

            text = text.trim();
            if (text.startsWith("```")) {
                int firstNewline = text.indexOf('\n');
                int lastBackticks = text.lastIndexOf("```");
                if (firstNewline != -1 && lastBackticks != -1 && lastBackticks > firstNewline) {
                    text = text.substring(firstNewline + 1, lastBackticks).trim();
                }
            }

            GeminiChatResult result = objectMapper.readValue(text, GeminiChatResult.class);
            if (result == null || result.getAnswer() == null || result.getAnswer().isBlank()) {
                throw new CustomException("Lỗi định dạng kết quả nhận được từ hệ thống trợ lý AI.", HttpStatus.BAD_GATEWAY);
            }

            if (result.getSuggestedActionIds() != null) {
                result.setSuggestedActionIds(
                    result.getSuggestedActionIds().stream()
                        .filter(java.util.Objects::nonNull)
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .distinct()
                        .collect(java.util.stream.Collectors.toList())
                );
            } else {
                result.setSuggestedActionIds(java.util.Collections.emptyList());
            }

            return result;

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logSanitizedError("Gemini provider HTTP error status: " + e.getStatusCode(), e);
            HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
            if (status == HttpStatus.TOO_MANY_REQUESTS) {
                throw new CustomException("Dịch vụ trợ lý AI tạm thời hết hạn mức cuộc gọi. Vui lòng quay lại sau.", HttpStatus.TOO_MANY_REQUESTS);
            }
            if (status == HttpStatus.BAD_REQUEST) {
                throw new CustomException("Yêu cầu không hợp lệ gửi tới dịch vụ trợ lý AI.", HttpStatus.BAD_REQUEST);
            }
            if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.FORBIDDEN) {
                throw new CustomException("Dịch vụ trợ lý AI từ chối truy cập (lỗi xác thực/cấu hình).", HttpStatus.BAD_GATEWAY);
            }
            if (status.is5xxServerError()) {
                throw new CustomException("Dịch vụ trợ lý AI gặp sự cố hệ thống. Vui lòng thử lại sau.", HttpStatus.BAD_GATEWAY);
            }
            throw new CustomException("Yêu cầu phản hồi bị từ chối hoặc không hợp lệ từ dịch vụ trợ lý AI.", HttpStatus.BAD_GATEWAY);
        } catch (RestClientException e) {
            logSanitizedError("Gemini provider network request failed", e);
            if (e.getCause() instanceof java.net.SocketTimeoutException || e.getMessage().contains("timed out") || e.getMessage().contains("Timeout")) {
                throw new CustomException("Kết nối tới hệ thống trợ lý AI bị quá thời hạn (timeout). Vui lòng thử lại.", HttpStatus.GATEWAY_TIMEOUT);
            }
            throw new CustomException("Không thể kết nối tới dịch vụ trợ lý AI. Vui lòng thử lại sau.", HttpStatus.SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            logSanitizedError("Error processing AI chat response", e);
            if (e instanceof CustomException) {
                throw (CustomException) e;
            }
            throw new CustomException("Lỗi định dạng kết quả nhận được từ hệ thống trợ lý AI.", HttpStatus.BAD_GATEWAY);
        }
    }


    private void logSanitizedError(String prefix, Throwable t) {
        if (t == null) {
            log.error(prefix);
            return;
        }
        String message = t.getMessage();
        if (message != null && apiKey != null && !apiKey.isBlank() && message.contains(apiKey)) {
            message = message.replace(apiKey, "REDACTED");
        }
        log.error("{}: {}", prefix, message);
    }

    private void validateAndNormalizeResult(DiagnosisResult result) {
        if (result == null) {
            throw new CustomException("Kết quả chẩn đoán từ hệ thống AI bị lỗi.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getPlantName() == null || result.getPlantName().isBlank()) {
            throw new CustomException("Tên cây cảnh bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getDiseaseName() == null || result.getDiseaseName().isBlank()) {
            throw new CustomException("Tên bệnh hại bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getConfidenceScore() == null) {
            throw new CustomException("Độ tin cậy bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        double confidence = result.getConfidenceScore().doubleValue();
        if (confidence < 0.0 || confidence > 100.0) {
            throw new CustomException("Độ tin cậy nằm ngoài phạm vi cho phép [0, 100].", HttpStatus.BAD_GATEWAY);
        }
        if (result.getSeverity() == null) {
            throw new CustomException("Mức độ nghiêm trọng bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getResult() == null || result.getResult().isBlank()) {
            throw new CustomException("Mô tả triệu chứng bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getRecommendation() == null || result.getRecommendation().isBlank()) {
            throw new CustomException("Khuyến nghị bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getObservedSymptoms() == null || result.getObservedSymptoms().isBlank()) {
            throw new CustomException("Triệu chứng cụ thể bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getPossibleCauses() == null || result.getPossibleCauses().isBlank()) {
            throw new CustomException("Nguyên nhân có thể bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getAlternativeDiagnoses() == null) {
            throw new CustomException("Danh sách chẩn đoán thay thế bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getTreatmentSteps() == null) {
            throw new CustomException("Danh sách bước điều trị bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getPreventionSteps() == null) {
            throw new CustomException("Danh sách biện pháp phòng ngừa bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }
        if (result.getKeywords() == null) {
            throw new CustomException("Danh sách từ khóa bị thiếu trong phản hồi của hệ thống AI.", HttpStatus.BAD_GATEWAY);
        }

        // Set default value for diagnosable if not present
        if (result.getDiagnosable() == null) {
            result.setDiagnosable(true);
        }

        // Safe check for non-diagnosable image: override disease name to prevent fabricated diseases
        if (Boolean.FALSE.equals(result.getDiagnosable())) {
            result.setDiseaseName("Không thể nhận diện");
        }

        // Normalize string fields
        result.setPlantName(normalizeString(result.getPlantName(), 150));
        result.setDiseaseName(normalizeString(result.getDiseaseName(), 150));
        result.setResult(normalizeString(result.getResult(), 2000));
        result.setRecommendation(normalizeString(result.getRecommendation(), 2000));
        result.setObservedSymptoms(normalizeString(result.getObservedSymptoms(), 2000));
        result.setPossibleCauses(normalizeString(result.getPossibleCauses(), 2000));
        result.setUrgentWarning(normalizeString(result.getUrgentWarning(), 1000));
        result.setDisclaimer(normalizeString(result.getDisclaimer(), 1000));
        result.setUncertaintyReason(normalizeString(result.getUncertaintyReason(), 1000));

        // Normalize lists
        result.setAlternativeDiagnoses(normalizeList(result.getAlternativeDiagnoses(), 5, 255));
        result.setTreatmentSteps(normalizeList(result.getTreatmentSteps(), 10, 500));
        result.setPreventionSteps(normalizeList(result.getPreventionSteps(), 10, 500));
        result.setKeywords(normalizeList(result.getKeywords(), 10, 100));

        // Normalize recommendation categories list using the category allowlist normalizer
        result.setRecommendationCategories(RecommendationCategoryNormalizer.normalizeList(result.getRecommendationCategories()));
    }

    private String normalizeString(String s, int maxLength) {
        if (s == null) {
            return "";
        }
        String trimmed = s.trim();
        if (trimmed.length() > maxLength) {
            return trimmed.substring(0, maxLength);
        }
        return trimmed;
    }

    private List<String> normalizeList(List<String> list, int maxEntries, int maxEntryLength) {
        if (list == null) {
            return java.util.Collections.emptyList();
        }
        return list.stream()
                .filter(java.util.Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .limit(maxEntries)
                .map(s -> s.length() > maxEntryLength ? s.substring(0, maxEntryLength) : s)
                .collect(java.util.stream.Collectors.toList());
    }
}
