-- SQL Patch: Add optional user context to AI diagnosis history
-- This patch is safe to run more than once on Microsoft Azure SQL Database.
-- Run it while connected directly to the target GreenLife database.

IF OBJECT_ID(N'dbo.diagnosis_history', N'U') IS NULL
BEGIN
    THROW 50001, 'Table dbo.diagnosis_history does not exist in the selected database.', 1;
END;
GO

IF COL_LENGTH(N'dbo.diagnosis_history', N'user_context') IS NULL
BEGIN
    ALTER TABLE dbo.diagnosis_history
        ADD user_context NVARCHAR(500) NULL;
END;
GO
