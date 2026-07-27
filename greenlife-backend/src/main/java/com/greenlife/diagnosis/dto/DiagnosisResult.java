package com.greenlife.diagnosis.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.greenlife.diagnosis.entity.enums.Severity;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisResult {
    private String plantName;
    private String diseaseName;
    @JsonAlias("confidence")
    private BigDecimal confidenceScore;
    private Severity severity;
    private String result;
    private String recommendation;
    
    private String observedSymptoms;
    private String possibleCauses;
    private List<String> alternativeDiagnoses;
    private List<String> treatmentSteps;
    private List<String> preventionSteps;
    private String urgentWarning;
    private String disclaimer;
    
    private List<String> keywords;

    // Structured recommendation / confidence contract fields
    private Boolean diagnosable;
    private String uncertaintyReason;
    private List<String> recommendationCategories;
}

