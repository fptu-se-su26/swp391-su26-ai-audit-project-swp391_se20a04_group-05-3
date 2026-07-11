-- Alter plants table to add sku column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('plants') AND name = 'sku'
)
BEGIN
    ALTER TABLE plants ADD sku NVARCHAR(100) NULL;
END
GO
