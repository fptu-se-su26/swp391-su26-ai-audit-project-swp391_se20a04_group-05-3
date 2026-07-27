package com.greenlife.diagnosis.service;

import com.greenlife.diagnosis.dto.DiagnosisResult;

public interface PlantDiseaseClassifier {
    DiagnosisResult classify(String originalFilename, byte[] fileBytes, String userContext);

    default DiagnosisResult classify(String originalFilename, byte[] fileBytes) {
        return classify(originalFilename, fileBytes, null);
    }
}
