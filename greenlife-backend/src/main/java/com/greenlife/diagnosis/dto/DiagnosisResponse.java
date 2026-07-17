package com.greenlife.diagnosis.dto;

import com.greenlife.diagnosis.entity.enums.Severity;
import com.greenlife.plant.dto.PlantResponse;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisResponse {
    private Integer id;
    private Integer diagnosisId; // Maps to id for frontend compatibility
    private Integer plantId;
    private String plantName;
    private String imageUrl;
    private String diseaseName;
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
    
    private List<PlantResponse> recommendedProducts;
    private List<com.greenlife.booking.dto.PlantCareServiceResponse> recommendedServices;
    
    private String provider;
    private String model;
    private String processingStatus;
    
    // Structured recommendation & escalation fields
    private Boolean expertReviewRecommended;
    private String escalationReason;
    private Boolean diagnosable;
    private String uncertaintyReason;

    private LocalDateTime createdAt;
}

