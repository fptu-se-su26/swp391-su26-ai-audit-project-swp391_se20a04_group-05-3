-- SQL Patch: Add verification_document to stores table
-- Date: 2026-06-15

IF NOT EXISTS (
    SELECT * 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('stores') AND name = 'verification_document'
)
BEGIN
    ALTER TABLE stores ADD verification_document NVARCHAR(500) NULL;
END
GO
