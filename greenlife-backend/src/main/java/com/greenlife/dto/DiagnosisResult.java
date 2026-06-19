package com.greenlife.dto;

import com.greenlife.entity.enums.Severity;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisResult {
    private String diseaseName;
    private BigDecimal confidenceScore;
    private Severity severity;
    private String result;
    private String recommendation;
}
