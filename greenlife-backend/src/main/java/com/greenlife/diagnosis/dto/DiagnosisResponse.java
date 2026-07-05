package com.greenlife.diagnosis.dto;

import com.greenlife.diagnosis.entity.enums.Severity;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisResponse {
    private Integer id;
    private Integer plantId;
    private String imageUrl;
    private String diseaseName;
    private BigDecimal confidenceScore;
    private Severity severity;
    private String result;
    private String recommendation;
    private LocalDateTime createdAt;
}
