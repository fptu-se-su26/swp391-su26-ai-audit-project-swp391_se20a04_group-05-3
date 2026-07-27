USE [GreenLife];
GO

-- 1. Check if the orders table exists
IF OBJECT_ID('dbo.orders', 'U') IS NULL
BEGIN
    PRINT 'Error: Table dbo.orders does not exist. Please run greenlife.sql first.';
    SET NOEXEC ON; -- Stop execution of subsequent batches if table does not exist
END
GO

-- 2. Drop any check constraints on dbo.orders referencing payment_method
DECLARE @ConstraintName NVARCHAR(256);
DECLARE @Sql NVARCHAR(MAX);

DECLARE constraint_cursor CURSOR FOR
SELECT name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('dbo.orders')
  AND (definition LIKE '%payment_method%' OR name = 'chk_orders_payment_method');

OPEN constraint_cursor;
FETCH NEXT FROM constraint_cursor INTO @ConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Sql = 'ALTER TABLE dbo.orders DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
    PRINT 'Dropping constraint: ' + @ConstraintName;
    EXEC sp_executesql @Sql;
    FETCH NEXT FROM constraint_cursor INTO @ConstraintName;
END;

CLOSE constraint_cursor;
DEALLOCATE constraint_cursor;
GO

-- 3. Add the updated check constraint chk_orders_payment_method
PRINT 'Adding updated constraint chk_orders_payment_method...';
ALTER TABLE dbo.orders
ADD CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('COD', 'PAYOS', 'BANK_TRANSFER', 'MOMO', 'VNPAY'));
GO

-- 4. Verification query
PRINT 'Verifying current check constraints on dbo.orders referencing payment_method...';
SELECT name, definition
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('dbo.orders')
  AND definition LIKE '%payment_method%';
GO

-- Turn execution back on in case NOEXEC was set
SET NOEXEC OFF;
GO
