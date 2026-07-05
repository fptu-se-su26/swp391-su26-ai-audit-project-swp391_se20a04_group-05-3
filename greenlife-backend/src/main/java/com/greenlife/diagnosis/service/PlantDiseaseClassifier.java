package com.greenlife.diagnosis.service;

import com.greenlife.diagnosis.dto.DiagnosisResult;

public interface PlantDiseaseClassifier {
    DiagnosisResult classify(String originalFilename, byte[] fileBytes);
}
