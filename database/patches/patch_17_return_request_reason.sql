USE [GreenLife];
GO

SET NOCOUNT ON;
GO

PRINT 'Starting database patch 17: Return Request Reason...';
GO

IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
    THROW 51000, 'Table dbo.orders does not exist. Cannot apply patch_17.', 1;
END;
GO

IF COL_LENGTH(N'dbo.orders', N'return_request_reason') IS NULL
BEGIN
    PRINT 'Adding column return_request_reason to dbo.orders...';
    ALTER TABLE dbo.orders
    ADD return_request_reason NVARCHAR(500) NULL;
END
ELSE
BEGIN
    PRINT 'Column return_request_reason already exists. Skipping alteration.';
END;
GO

PRINT 'Verifying return request/reject reason columns...';

SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME IN ('return_reject_reason', 'return_request_reason')
ORDER BY COLUMN_NAME;
GO

PRINT 'Database patch 17 completed.';
GO
