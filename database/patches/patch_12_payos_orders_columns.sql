-- ============================================================================
-- GreenLife Database Patch 12: PayOS & Payment Provider Columns
-- ============================================================================
-- Please run this patch on the same SQL Server database configured in the
-- backend's datasource URL (default: GreenLife).
--
-- Instructions:
-- 1. Run this patch in SQL Server Management Studio (SSMS) or via sqlcmd.
-- 2. Verify all five columns exist using the verification query.
-- 3. Restart the backend application after running this patch.
-- ============================================================================

IF OBJECT_ID('dbo.orders', 'U') IS NULL
BEGIN
    THROW 50001, 'Table dbo.orders does not exist in this database. Please check your active database connection.', 1;
END;

-- 1. Add payment_provider column if missing
IF COL_LENGTH('dbo.orders', 'payment_provider') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD payment_provider VARCHAR(20) NULL;
END;

-- 2. Add payos_link_id column if missing
IF COL_LENGTH('dbo.orders', 'payos_link_id') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD payos_link_id VARCHAR(100) NULL;
END;

-- 3. Add payos_checkout_url column if missing
IF COL_LENGTH('dbo.orders', 'payos_checkout_url') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD payos_checkout_url VARCHAR(500) NULL;
END;

-- 4. Add payos_qr_code column if missing
IF COL_LENGTH('dbo.orders', 'payos_qr_code') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD payos_qr_code VARCHAR(1000) NULL;
END;

-- 5. Add payos_order_code column if missing
IF COL_LENGTH('dbo.orders', 'payos_order_code') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD payos_order_code BIGINT NULL;
END;

-- 6. Add Index for payos_link_id using dynamic SQL to prevent compile-time errors
IF COL_LENGTH('dbo.orders', 'payos_link_id') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'idx_orders_payos_link_id'
          AND object_id = OBJECT_ID('dbo.orders')
   )
BEGIN
    EXEC('CREATE INDEX idx_orders_payos_link_id
          ON dbo.orders(payos_link_id)
          WHERE payos_link_id IS NOT NULL;');
END;

-- 7. Add Index for payos_order_code using dynamic SQL to prevent compile-time errors
IF COL_LENGTH('dbo.orders', 'payos_order_code') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'idx_orders_payos_order_code'
          AND object_id = OBJECT_ID('dbo.orders')
   )
BEGIN
    EXEC('CREATE INDEX idx_orders_payos_order_code
          ON dbo.orders(payos_order_code)
          WHERE payos_order_code IS NOT NULL;');
END;
