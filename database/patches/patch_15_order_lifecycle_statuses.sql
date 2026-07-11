USE [GreenLife];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
    THROW 51000, 'Table dbo.orders does not exist. Please run greenlife.sql first.', 1;
END;
GO

IF COL_LENGTH(N'dbo.orders', N'status') IS NULL
BEGIN
    THROW 51001, 'Column dbo.orders.status does not exist.', 1;
END;
GO

DECLARE @Sql NVARCHAR(MAX) = N'';

SELECT @Sql = @Sql + N'ALTER TABLE dbo.orders DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';' + CHAR(13)
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.orders', N'U')
  AND (
        cc.name = N'chk_orders_status'
        OR (
            cc.definition LIKE N'%PENDING%'
            AND cc.definition LIKE N'%CONFIRMED%'
            AND cc.definition LIKE N'%SHIPPING%'
            AND cc.definition LIKE N'%DELIVERED%'
            AND cc.definition LIKE N'%CANCELLED%'
            AND cc.definition NOT LIKE N'%payment_status%'
        )
  );

IF LEN(@Sql) > 0
BEGIN
    PRINT 'Dropping existing order status constraint(s)...';
    EXEC sp_executesql @Sql;
END
ELSE
BEGIN
    PRINT 'No existing order status constraint found. Creating chk_orders_status...';
END;
GO

ALTER TABLE dbo.orders WITH CHECK
ADD CONSTRAINT chk_orders_status
CHECK ([status] IN (
    'PENDING',
    'CONFIRMED',
    'SHIPPING',
    'DELIVERED',
    'CANCELLED',
    'RECEIVED',
    'RETURN_REQUESTED'
));
GO

ALTER TABLE dbo.orders CHECK CONSTRAINT chk_orders_status;
GO

PRINT 'Verifying updated order status constraint...';

SELECT
    cc.name,
    cc.definition
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.orders', N'U')
  AND cc.name = N'chk_orders_status';
GO
