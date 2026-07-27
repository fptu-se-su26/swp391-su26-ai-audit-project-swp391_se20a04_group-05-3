-- Patch 23: System-Wide Address Two-Level Support and Seller KYC Evidence Persistence
-- Decision 19/2025/QĐ-TTg Two-Level Administrative Structure & Business Evidence Storage

-- 1. Add 2-Level Administrative Columns to customer_addresses
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'customer_addresses') AND name = 'province_code')
BEGIN
    ALTER TABLE customer_addresses ADD province_code VARCHAR(20) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'customer_addresses') AND name = 'commune_code')
BEGIN
    ALTER TABLE customer_addresses ADD commune_code VARCHAR(20) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'customer_addresses') AND name = 'commune_name')
BEGIN
    ALTER TABLE customer_addresses ADD commune_name NVARCHAR(100) NULL;
END;

-- Make legacy district column nullable for 2-level addresses
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'customer_addresses') AND name = 'district' AND is_nullable = 0)
BEGIN
    ALTER TABLE customer_addresses ALTER COLUMN district NVARCHAR(100) NULL;
END;

-- 2. Add KYC & Business Evidence Columns to stores
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'stores') AND name = 'business_type')
BEGIN
    ALTER TABLE stores ADD business_type VARCHAR(50) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'stores') AND name = 'cccd_front_url')
BEGIN
    ALTER TABLE stores ADD cccd_front_url VARCHAR(500) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'stores') AND name = 'cccd_back_url')
BEGIN
    ALTER TABLE stores ADD cccd_back_url VARCHAR(500) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'stores') AND name = 'business_evidence_urls')
BEGIN
    ALTER TABLE stores ADD business_evidence_urls NVARCHAR(MAX) NULL;
END;
