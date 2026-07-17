package com.greenlife.diagnosis.entity;

import com.greenlife.user.entity.User;
import com.greenlife.plant.entity.Plant;

import com.greenlife.diagnosis.entity.enums.Severity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "diagnosis_history")
@SQLRestriction("deleted = 0")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagnosisHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    private Plant plant;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "disease_name", length = 150)
    private String diseaseName;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Severity severity;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String result;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String recommendation;

    @Column(name = "plant_name", length = 150)
    private String plantName;

    @Column(length = 50)
    private String provider;

    @Column(length = 100)
    private String model;

    @Column(name = "processing_status", length = 50)
    private String processingStatus;

    @Column(name = "observed_symptoms", columnDefinition = "NVARCHAR(MAX)")
    private String observedSymptoms;

    @Column(name = "possible_causes", columnDefinition = "NVARCHAR(MAX)")
    private String possibleCauses;

    @Column(name = "alternative_diagnoses", columnDefinition = "NVARCHAR(MAX)")
    private String alternativeDiagnoses;

    @Column(name = "treatment_steps", columnDefinition = "NVARCHAR(MAX)")
    private String treatmentSteps;

    @Column(name = "prevention_steps", columnDefinition = "NVARCHAR(MAX)")
    private String preventionSteps;

    @Column(name = "urgent_warning", columnDefinition = "NVARCHAR(MAX)")
    private String urgentWarning;

    @Column(name = "disclaimer", columnDefinition = "NVARCHAR(MAX)")
    private String disclaimer;

    @Column(name = "diagnosable", nullable = false)
    @Builder.Default
    private Boolean diagnosable = true;

    @Column(name = "uncertainty_reason", columnDefinition = "NVARCHAR(MAX)")
    private String uncertaintyReason;

    @Column(name = "expert_review_recommended", nullable = false)
    @Builder.Default
    private Boolean expertReviewRecommended = false;

    @Column(name = "escalation_reason", length = 50)
    private String escalationReason;

    @Column(name = "recommendation_categories", columnDefinition = "NVARCHAR(MAX)")
    private String recommendationCategories;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}

