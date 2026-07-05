package com.greenlife.diagnosis.service;

import com.greenlife.diagnosis.dto.DiagnosisResult;
import com.greenlife.diagnosis.entity.enums.Severity;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class MockPlantDiseaseClassifier implements PlantDiseaseClassifier {

    @Override
    public DiagnosisResult classify(String originalFilename, byte[] fileBytes) {
        // Return a realistic mock result for testing and simulation
        return DiagnosisResult.builder()
                .diseaseName("Bệnh héo rũ (Fusarium Wilt)")
                .confidenceScore(new BigDecimal("94.85"))
                .severity(Severity.MEDIUM)
                .result("Cây bị nhiễm nấm hoại tử Fusarium oxysporum tấn công vào hệ thống mạch dẫn nước và dinh dưỡng, làm các nhánh lá héo úa vàng vọt từ gốc lên ngọn.")
                .recommendation("Tiến hành cách ly ngay các cây bệnh. Cắt tỉa phần lá héo khô bằng kéo tiệt trùng. Phun chế phẩm Trichoderma hoặc tưới các loại thuốc diệt nấm chứa hoạt chất Metalaxyl hay Carbendazim để phòng trị nấm lây lan.")
                .build();
    }
}
