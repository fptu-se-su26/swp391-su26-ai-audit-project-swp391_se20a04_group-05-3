-- SQL Patch: Create store_approval_audits table and ensure stores check constraint
-- Date: 2026-06-18

USE GreenLife;
GO

-- 1. Ensure check constraint exists and matches the store status options
IF EXISTS (
    SELECT * 
    FROM sys.objects 
    WHERE parent_object_id = OBJECT_ID('stores') AND name = 'chk_stores_status' AND type = 'C'
)
BEGIN
    ALTER TABLE stores DROP CONSTRAINT chk_stores_status;
END
GO

ALTER TABLE stores ADD CONSTRAINT chk_stores_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));
GO

-- 2. Create store_approval_audits table
IF OBJECT_ID('store_approval_audits', 'U') IS NULL
BEGIN
    CREATE TABLE store_approval_audits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        store_id INT NOT NULL,
        admin_id INT NOT NULL,
        old_status VARCHAR(30) NOT NULL,
        new_status VARCHAR(30) NOT NULL,
        reason NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_audits_store FOREIGN KEY (store_id) REFERENCES stores(id),
        CONSTRAINT fk_audits_admin FOREIGN KEY (admin_id) REFERENCES users(id)
    );
END
GO
