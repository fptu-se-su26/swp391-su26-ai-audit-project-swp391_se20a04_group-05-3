-- SQL Patch: Add AI production foundation columns to diagnosis_history
-- Date: 2026-07-16

USE GreenLife;
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'diagnosis_history')
BEGIN
    -- 1. Add plant_name column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'plant_name')
    BEGIN
        ALTER TABLE diagnosis_history ADD plant_name NVARCHAR(150) NULL;
    END

    -- 2. Add provider column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'provider')
    BEGIN
        ALTER TABLE diagnosis_history ADD provider VARCHAR(50) NULL;
    END

    -- 3. Add model column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'model')
    BEGIN
        ALTER TABLE diagnosis_history ADD model VARCHAR(100) NULL;
    END

    -- 4. Add processing_status column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'processing_status')
    BEGIN
        ALTER TABLE diagnosis_history ADD processing_status VARCHAR(50) NULL;
    END

    -- 5. Add observed_symptoms column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'observed_symptoms')
    BEGIN
        ALTER TABLE diagnosis_history ADD observed_symptoms NVARCHAR(MAX) NULL;
    END

    -- 6. Add possible_causes column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'possible_causes')
    BEGIN
        ALTER TABLE diagnosis_history ADD possible_causes NVARCHAR(MAX) NULL;
    END

    -- 7. Add alternative_diagnoses column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'alternative_diagnoses')
    BEGIN
        ALTER TABLE diagnosis_history ADD alternative_diagnoses NVARCHAR(MAX) NULL;
    END

    -- 8. Add treatment_steps column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'treatment_steps')
    BEGIN
        ALTER TABLE diagnosis_history ADD treatment_steps NVARCHAR(MAX) NULL;
    END

    -- 9. Add prevention_steps column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'prevention_steps')
    BEGIN
        ALTER TABLE diagnosis_history ADD prevention_steps NVARCHAR(MAX) NULL;
    END

    -- 10. Add urgent_warning column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'urgent_warning')
    BEGIN
        ALTER TABLE diagnosis_history ADD urgent_warning NVARCHAR(MAX) NULL;
    END

    -- 11. Add disclaimer column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'disclaimer')
    BEGIN
        ALTER TABLE diagnosis_history ADD disclaimer NVARCHAR(MAX) NULL;
    END

    -- 12. Add diagnosable column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'diagnosable')
    BEGIN
        ALTER TABLE diagnosis_history ADD diagnosable BIT NOT NULL CONSTRAINT DF_diagnosis_history_diagnosable DEFAULT 1;
    END

    -- 13. Add uncertainty_reason column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'uncertainty_reason')
    BEGIN
        ALTER TABLE diagnosis_history ADD uncertainty_reason NVARCHAR(MAX) NULL;
    END

    -- 14. Add expert_review_recommended column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'expert_review_recommended')
    BEGIN
        ALTER TABLE diagnosis_history ADD expert_review_recommended BIT NOT NULL CONSTRAINT DF_diagnosis_history_expert_review_recommended DEFAULT 0;
    END

    -- 15. Add escalation_reason column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'escalation_reason')
    BEGIN
        ALTER TABLE diagnosis_history ADD escalation_reason NVARCHAR(50) NULL;
    END

    -- 16. Add recommendation_categories column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'recommendation_categories')
    BEGIN
        ALTER TABLE diagnosis_history ADD recommendation_categories NVARCHAR(MAX) NULL;
    END
END
GO
