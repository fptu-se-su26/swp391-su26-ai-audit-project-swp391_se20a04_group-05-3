USE [GreenLife];
GO

SET NOCOUNT ON;
GO

PRINT 'Starting database patch 18: Return Request Form & Evidence Images...';
GO

-- Confirmed from database/greenlife.sql & Order.java: the primary key column of dbo.orders is "id".
-- 1. Ensure dbo.orders exists, otherwise throw
IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
    THROW 51000, 'Table dbo.orders does not exist. Cannot apply patch_18.', 1;
END;
GO

-- 2. Add return_request_reason_code column if missing
IF COL_LENGTH(N'dbo.orders', N'return_request_reason_code') IS NULL
BEGIN
    PRINT 'Adding column return_request_reason_code to dbo.orders...';
    ALTER TABLE dbo.orders
    ADD return_request_reason_code NVARCHAR(100) NULL;
END
ELSE
BEGIN
    PRINT 'Column return_request_reason_code already exists. Skipping.';
END;
GO

-- 3. Create dbo.order_return_evidence if missing
-- Note: Current project convention requires length 500 for image_url, as defined in OrderReturnEvidence.java (length = 500) and other image fields in database/greenlife.sql.
-- Note: ON DELETE CASCADE is not added as the project relies on JPA-level cascade deletion (CascadeType.ALL, orphanRemoval = true) rather than database-level cascades.
IF OBJECT_ID(N'dbo.order_return_evidence', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.order_return_evidence...';
    CREATE TABLE dbo.order_return_evidence (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        image_url NVARCHAR(500) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_order_return_evidence_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id)
    );
END
ELSE
BEGIN
    PRINT 'Table dbo.order_return_evidence already exists. Skipping creation.';
END;
GO

-- 4. Create index on order_id in order_return_evidence if missing
IF NOT EXISTS (
    SELECT * 
    FROM sys.indexes 
    WHERE name = 'ix_order_return_evidence_order_id' 
      AND object_id = OBJECT_ID('dbo.order_return_evidence')
)
BEGIN
    PRINT 'Creating index ix_order_return_evidence_order_id...';
    CREATE INDEX ix_order_return_evidence_order_id ON dbo.order_return_evidence(order_id);
END
ELSE
BEGIN
    PRINT 'Index ix_order_return_evidence_order_id already exists. Skipping creation.';
END;
GO

-- 5. Final verification SELECT
PRINT 'Verifying schema...';

SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND (
        (TABLE_NAME = 'orders' AND COLUMN_NAME = 'return_request_reason_code')
        OR TABLE_NAME = 'order_return_evidence'
      )
ORDER BY TABLE_NAME, ORDINAL_POSITION;
GO

SELECT
    fk.name AS foreign_key_name,
    OBJECT_NAME(fk.parent_object_id) AS child_table,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS child_column,
    OBJECT_NAME(fk.referenced_object_id) AS parent_table,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS parent_column
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc
    ON fk.object_id = fkc.constraint_object_id
WHERE fk.name = 'fk_order_return_evidence_orders';
GO

PRINT 'Database patch 18 completed.';
GO
