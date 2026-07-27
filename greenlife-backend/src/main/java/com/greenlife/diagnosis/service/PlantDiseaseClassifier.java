package com.greenlife.diagnosis.service;

import com.greenlife.diagnosis.dto.DiagnosisResult;

public interface PlantDiseaseClassifier {
    default DiagnosisResult classify(String originalFilename, byte[] fileBytes) {
        return classify(originalFilename, fileBytes, null);
    }
    DiagnosisResult classify(String originalFilename, byte[] fileBytes, String userContext);
}
