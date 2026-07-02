package com.greenlife.service;

import com.greenlife.dto.DiagnosisResult;

public interface PlantDiseaseClassifier {
    DiagnosisResult classify(String originalFilename, byte[] fileBytes);
}
