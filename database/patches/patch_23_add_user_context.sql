-- SQL Patch 23: Add user_context optional column to diagnosis_history
-- Date: 2026-07-24

USE GreenLife;
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'diagnosis_history')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('diagnosis_history') AND name = 'user_context')
    BEGIN
        ALTER TABLE diagnosis_history ADD user_context NVARCHAR(500) NULL;
        PRINT 'Added column user_context to diagnosis_history successfully.';
    END
    ELSE
    BEGIN
        PRINT 'Column user_context already exists on diagnosis_history.';
    END
END
GO
