-- SQL Patch: Add indexes and soft delete column to diagnosis_history
-- Date: 2026-06-20

USE GreenLife;
GO

-- 1. Add deleted column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'deleted')
BEGIN
    ALTER TABLE diagnosis_history ADD deleted BIT NOT NULL DEFAULT 0;
END
GO

-- 2. Add indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_diagnosis_customer_id' AND object_id = OBJECT_ID('diagnosis_history'))
BEGIN
    CREATE INDEX ix_diagnosis_customer_id ON diagnosis_history(customer_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_diagnosis_plant_id' AND object_id = OBJECT_ID('diagnosis_history'))
BEGIN
    CREATE INDEX ix_diagnosis_plant_id ON diagnosis_history(plant_id);
END
GO
