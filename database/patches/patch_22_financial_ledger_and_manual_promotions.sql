SET NOCOUNT ON;
GO

PRINT 'Starting database patch 22: Financial Ledger and Manual Promotions...';
GO

-- ============================================================================
-- 1. EXISTING TABLE ALTERATIONS (Idempotent column additions)
-- ============================================================================

-- A. stores: commission_rate override (fractional rate between 0 and 1)
IF COL_LENGTH(N'dbo.stores', N'commission_rate') IS NULL
BEGIN
    PRINT 'Adding column stores.commission_rate...';
    ALTER TABLE dbo.stores ADD commission_rate DECIMAL(5,4) NULL;
END;
GO

IF OBJECT_ID(N'dbo.chk_stores_commission_rate', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.stores ADD CONSTRAINT chk_stores_commission_rate 
    CHECK (commission_rate IS NULL OR (commission_rate >= 0.0000 AND commission_rate <= 1.0000));
END;
GO

-- B. cart_items: quoted_price (last quoted price used for price change notifications)
IF COL_LENGTH(N'dbo.cart_items', N'quoted_price') IS NULL
BEGIN
    PRINT 'Adding column cart_items.quoted_price...';
    ALTER TABLE dbo.cart_items ADD quoted_price DECIMAL(12,0) NULL;
END;
GO

IF OBJECT_ID(N'dbo.chk_cart_items_quoted_price', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items ADD CONSTRAINT chk_cart_items_quoted_price 
    CHECK (quoted_price IS NULL OR quoted_price >= 0);
END;
GO

-- C. order_details: immutable checkout snapshot columns
IF COL_LENGTH(N'dbo.order_details', N'base_unit_price') IS NULL
BEGIN
    PRINT 'Adding column order_details.base_unit_price...';
    ALTER TABLE dbo.order_details ADD base_unit_price DECIMAL(12,0) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_base_price', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_base_price 
    CHECK (base_unit_price IS NULL OR base_unit_price >= 0);
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'store_funded_discount') IS NULL
BEGIN
    PRINT 'Adding column order_details.store_funded_discount...';
    ALTER TABLE dbo.order_details ADD store_funded_discount DECIMAL(12,0) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_store_discount', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_store_discount 
    CHECK (store_funded_discount IS NULL OR store_funded_discount >= 0);
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'platform_funded_discount') IS NULL
BEGIN
    PRINT 'Adding column order_details.platform_funded_discount...';
    ALTER TABLE dbo.order_details ADD platform_funded_discount DECIMAL(12,0) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_platform_discount', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_platform_discount 
    CHECK (platform_funded_discount IS NULL OR platform_funded_discount >= 0);
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'final_customer_price') IS NULL
BEGIN
    PRINT 'Adding column order_details.final_customer_price...';
    ALTER TABLE dbo.order_details ADD final_customer_price DECIMAL(12,0) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_final_price', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_final_price 
    CHECK (final_customer_price IS NULL OR final_customer_price >= 0);
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'promotion_id') IS NULL
BEGIN
    PRINT 'Adding column order_details.promotion_id...';
    ALTER TABLE dbo.order_details ADD promotion_id INT NULL;
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'promotion_funding_source') IS NULL
BEGIN
    PRINT 'Adding column order_details.promotion_funding_source...';
    ALTER TABLE dbo.order_details ADD promotion_funding_source VARCHAR(30) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_promo_funding_source', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_promo_funding_source 
    CHECK (promotion_funding_source IS NULL OR promotion_funding_source IN ('PLATFORM_FUNDED', 'STORE_FUNDED', 'CO_FUNDED'));
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'commission_rate') IS NULL
BEGIN
    PRINT 'Adding column order_details.commission_rate...';
    ALTER TABLE dbo.order_details ADD commission_rate DECIMAL(5,4) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_comm_rate', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_comm_rate 
    CHECK (commission_rate IS NULL OR (commission_rate >= 0.0000 AND commission_rate <= 1.0000));
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'commission_base') IS NULL
BEGIN
    PRINT 'Adding column order_details.commission_base...';
    ALTER TABLE dbo.order_details ADD commission_base DECIMAL(12,0) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_comm_base', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_comm_base 
    CHECK (commission_base IS NULL OR commission_base >= 0);
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'commission_amount') IS NULL
BEGIN
    PRINT 'Adding column order_details.commission_amount...';
    ALTER TABLE dbo.order_details ADD commission_amount DECIMAL(12,0) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_comm_amount', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_comm_amount 
    CHECK (commission_amount IS NULL OR commission_amount >= 0);
END;
GO

IF COL_LENGTH(N'dbo.order_details', N'store_net_amount') IS NULL
BEGIN
    PRINT 'Adding column order_details.store_net_amount...';
    ALTER TABLE dbo.order_details ADD store_net_amount DECIMAL(12,0) NULL;
END;
GO
IF OBJECT_ID(N'dbo.chk_order_details_store_net', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.order_details ADD CONSTRAINT chk_order_details_store_net 
    CHECK (store_net_amount IS NULL OR store_net_amount >= 0);
END;
GO


-- ============================================================================
-- 2. NEW TABLE CREATIONS
-- ============================================================================

-- A. promotions: Manual campaigns managed by system Admin
IF OBJECT_ID(N'dbo.promotions', N'U') IS NULL
BEGIN
    PRINT 'Creating table promotions...';
    CREATE TABLE dbo.promotions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(150) NOT NULL,
        description NVARCHAR(MAX) NULL,
        scope_type VARCHAR(30) NOT NULL, -- 'GLOBAL', 'STORE', 'PRODUCT'
        discount_type VARCHAR(30) NOT NULL, -- 'PERCENTAGE', 'FIXED'
        discount_value DECIMAL(12,0) NOT NULL,
        funding_source VARCHAR(30) NOT NULL, -- 'PLATFORM_FUNDED', 'STORE_FUNDED', 'CO_FUNDED'
        platform_funding_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        store_funding_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        priority INT NOT NULL DEFAULT 0,
        max_discount_amount DECIMAL(12,0) NULL,
        budget DECIMAL(12,0) NOT NULL,
        reserved_budget DECIMAL(12,0) NOT NULL DEFAULT 0,
        consumed_budget DECIMAL(12,0) NOT NULL DEFAULT 0,
        released_budget DECIMAL(12,0) NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'ACTIVE', 'ENDED', 'CANCELLED'
        version INT NOT NULL DEFAULT 0,
        created_by INT NOT NULL,
        activated_by INT NULL,
        ended_by INT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        activated_at DATETIME2 NULL,
        ended_at DATETIME2 NULL,
        end_reason NVARCHAR(250) NULL,
        CONSTRAINT chk_promo_scope CHECK (scope_type IN ('GLOBAL', 'STORE', 'PRODUCT')),
        CONSTRAINT chk_promo_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
        CONSTRAINT chk_promo_funding CHECK (funding_source IN ('PLATFORM_FUNDED', 'STORE_FUNDED', 'CO_FUNDED')),
        CONSTRAINT chk_promo_status CHECK (status IN ('DRAFT', 'ACTIVE', 'ENDED', 'CANCELLED')),
        CONSTRAINT chk_promo_discount_value CHECK (discount_value > 0),
        CONSTRAINT chk_promo_percentage CHECK (discount_type <> 'PERCENTAGE' OR discount_value <= 100),
        CONSTRAINT chk_promo_max_discount CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
        CONSTRAINT chk_promo_budget CHECK (budget >= 0),
        CONSTRAINT chk_promo_reserved CHECK (reserved_budget >= 0),
        CONSTRAINT chk_promo_consumed CHECK (consumed_budget >= 0),
        CONSTRAINT chk_promo_released CHECK (released_budget >= 0),
        CONSTRAINT chk_promo_budget_cap CHECK (reserved_budget + consumed_budget <= budget),
        CONSTRAINT chk_promo_platform_ratio CHECK (funding_source <> 'PLATFORM_FUNDED' OR (platform_funding_ratio = 100.00 AND store_funding_ratio = 0.00)),
        CONSTRAINT chk_promo_store_ratio CHECK (funding_source <> 'STORE_FUNDED' OR (platform_funding_ratio = 0.00 AND store_funding_ratio = 100.00)),
        CONSTRAINT chk_promo_co_ratio CHECK (funding_source <> 'CO_FUNDED' OR (platform_funding_ratio > 0.00 AND store_funding_ratio > 0.00 AND (platform_funding_ratio + store_funding_ratio) = 100.00)),
        CONSTRAINT chk_promo_version CHECK (version >= 0),
        CONSTRAINT fk_promotions_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT fk_promotions_activated_by FOREIGN KEY (activated_by) REFERENCES dbo.users(id),
        CONSTRAINT fk_promotions_ended_by FOREIGN KEY (ended_by) REFERENCES dbo.users(id)
    );
END;
GO

-- Add circular reference foreign key to order_details safely
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'fk_order_details_promotions' 
      AND parent_object_id = OBJECT_ID('dbo.order_details')
)
BEGIN
    PRINT 'Adding constraint fk_order_details_promotions...';
    ALTER TABLE dbo.order_details ADD CONSTRAINT fk_order_details_promotions 
    FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(id);
END;
GO

-- Indexes for promotions
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_promotions_status_scope_priority' 
      AND object_id = OBJECT_ID('dbo.promotions')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_promotions_status_scope_priority 
    ON dbo.promotions(status, scope_type, priority);
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_promotions_created_by' 
      AND object_id = OBJECT_ID('dbo.promotions')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_promotions_created_by 
    ON dbo.promotions(created_by);
END;
GO


-- B. promotion_stores: Stores mapped to STORE-scope campaigns
IF OBJECT_ID(N'dbo.promotion_stores', N'U') IS NULL
BEGIN
    PRINT 'Creating table promotion_stores...';
    CREATE TABLE dbo.promotion_stores (
        promotion_id INT NOT NULL,
        store_id INT NOT NULL,
        CONSTRAINT pk_promotion_stores PRIMARY KEY (promotion_id, store_id),
        CONSTRAINT fk_promo_stores_promo FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(id),
        CONSTRAINT fk_promo_stores_store FOREIGN KEY (store_id) REFERENCES dbo.stores(id)
    );
END;
GO

-- Lookup index on (store_id, promotion_id) for promotion stores
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_promotion_stores_lookup' 
      AND object_id = OBJECT_ID('dbo.promotion_stores')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_promotion_stores_lookup 
    ON dbo.promotion_stores(store_id, promotion_id);
END;
GO


-- C. promotion_products: Products mapped to PRODUCT-scope campaigns
IF OBJECT_ID(N'dbo.promotion_products', N'U') IS NULL
BEGIN
    PRINT 'Creating table promotion_products...';
    CREATE TABLE dbo.promotion_products (
        promotion_id INT NOT NULL,
        plant_id INT NOT NULL,
        CONSTRAINT pk_promotion_products PRIMARY KEY (promotion_id, plant_id),
        CONSTRAINT fk_promo_products_promo FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(id),
        CONSTRAINT fk_promo_products_plant FOREIGN KEY (plant_id) REFERENCES dbo.plants(id)
    );
END;
GO

-- Lookup index on (plant_id, promotion_id) for promotion products
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_promotion_products_lookup' 
      AND object_id = OBJECT_ID('dbo.promotion_products')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_promotion_products_lookup 
    ON dbo.promotion_products(plant_id, promotion_id);
END;
GO


-- D. promotion_audit_history: Immutable promotion status change audit
IF OBJECT_ID(N'dbo.promotion_audit_history', N'U') IS NULL
BEGIN
    PRINT 'Creating table promotion_audit_history...';
    CREATE TABLE dbo.promotion_audit_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        promotion_id INT NOT NULL,
        previous_status VARCHAR(30) NULL,
        new_status VARCHAR(30) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        actor_user_id INT NOT NULL,
        reason NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_promo_audit_promo FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(id),
        CONSTRAINT fk_promo_audit_actor FOREIGN KEY (actor_user_id) REFERENCES dbo.users(id)
    );
END;
GO


-- E. promotion_budget_reservations: Tracking locked promo budget per order checkout
IF OBJECT_ID(N'dbo.promotion_budget_reservations', N'U') IS NULL
BEGIN
    PRINT 'Creating table promotion_budget_reservations...';
    CREATE TABLE dbo.promotion_budget_reservations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        promotion_id INT NOT NULL,
        order_id INT NOT NULL,
        reservation_key VARCHAR(100) NOT NULL,
        total_discount_amount DECIMAL(12,0) NOT NULL,
        platform_funded_amount DECIMAL(12,0) NOT NULL,
        store_funded_amount DECIMAL(12,0) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'RESERVED', -- 'RESERVED', 'CONSUMED', 'RELEASED', 'EXPIRED'
        reserved_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        consumed_at DATETIME2 NULL,
        released_at DATETIME2 NULL,
        expires_at DATETIME2 NULL,
        version INT NOT NULL DEFAULT 0,
        CONSTRAINT uq_budget_res_key UNIQUE (reservation_key),
        CONSTRAINT chk_budget_res_amounts CHECK (total_discount_amount >= 0 AND platform_funded_amount >= 0 AND store_funded_amount >= 0),
        CONSTRAINT chk_budget_res_split CHECK (platform_funded_amount + store_funded_amount = total_discount_amount),
        CONSTRAINT chk_budget_res_status CHECK (status IN ('RESERVED', 'CONSUMED', 'RELEASED', 'EXPIRED')),
        CONSTRAINT chk_budget_res_exclusivity CHECK (NOT (consumed_at IS NOT NULL AND released_at IS NOT NULL)),
        CONSTRAINT chk_budget_res_version CHECK (version >= 0),
        CONSTRAINT fk_budget_res_promo FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(id),
        CONSTRAINT fk_budget_res_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_budget_res_promo_status' 
      AND object_id = OBJECT_ID('dbo.promotion_budget_reservations')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_budget_res_promo_status 
    ON dbo.promotion_budget_reservations(promotion_id, status);
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_budget_res_order' 
      AND object_id = OBJECT_ID('dbo.promotion_budget_reservations')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_budget_res_order 
    ON dbo.promotion_budget_reservations(order_id);
END;
GO


-- F. payment_transactions: Payment attempts supporting multiple links per order
IF OBJECT_ID(N'dbo.payment_transactions', N'U') IS NULL
BEGIN
    PRINT 'Creating table payment_transactions...';
    CREATE TABLE dbo.payment_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        payment_method VARCHAR(30) NOT NULL, -- 'COD', 'PAYOS'
        provider VARCHAR(30) NOT NULL,       -- 'MANUAL', 'PAYOS'
        provider_order_code BIGINT NULL,
        payment_link_id VARCHAR(100) NULL,
        provider_reference VARCHAR(150) NULL,
        amount DECIMAL(12,0) NOT NULL,
        attempt_number INT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'CREATED', -- 'CREATED', 'PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED', 'AMOUNT_MISMATCH', 'REQUIRES_REVIEW'
        idempotency_key VARCHAR(100) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        paid_at DATETIME2 NULL,
        cancelled_at DATETIME2 NULL,
        expired_at DATETIME2 NULL,
        failed_at DATETIME2 NULL,
        failure_code VARCHAR(50) NULL,
        failure_reason NVARCHAR(500) NULL,
        version INT NOT NULL DEFAULT 0,
        CONSTRAINT uq_pay_tx_idempotency UNIQUE (idempotency_key),
        CONSTRAINT uq_pay_tx_order_attempt UNIQUE (order_id, attempt_number),
        CONSTRAINT chk_pay_tx_amount CHECK (amount > 0),
        CONSTRAINT chk_pay_tx_attempt CHECK (attempt_number > 0),
        CONSTRAINT chk_pay_tx_status CHECK (status IN ('CREATED', 'PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED', 'AMOUNT_MISMATCH', 'REQUIRES_REVIEW')),
        CONSTRAINT chk_pay_tx_payment_method CHECK (payment_method IN ('COD', 'PAYOS')),
        CONSTRAINT chk_pay_tx_provider CHECK (provider IN ('MANUAL', 'PAYOS')),
        CONSTRAINT chk_pay_tx_method_provider_consistency CHECK (
            (payment_method = 'COD' AND provider = 'MANUAL') OR
            (payment_method = 'PAYOS' AND provider = 'PAYOS')
        ),
        CONSTRAINT chk_pay_tx_version CHECK (version >= 0),
        CONSTRAINT fk_pay_tx_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id)
    );
END;
GO

-- Filtered unique index for PayOS codes (only unique when not null)
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'uq_pay_tx_order_code' 
      AND object_id = OBJECT_ID('dbo.payment_transactions')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_pay_tx_order_code 
    ON dbo.payment_transactions(provider_order_code) 
    WHERE provider_order_code IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'uq_pay_tx_link_id' 
      AND object_id = OBJECT_ID('dbo.payment_transactions')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_pay_tx_link_id 
    ON dbo.payment_transactions(payment_link_id) 
    WHERE payment_link_id IS NOT NULL;
END;
GO

-- Only one payment transaction attempt per order may reach the 'PAID' state.
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'uq_pay_tx_one_paid_per_order' 
      AND object_id = OBJECT_ID('dbo.payment_transactions')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_pay_tx_one_paid_per_order 
    ON dbo.payment_transactions(order_id) 
    WHERE status = 'PAID';
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_pay_tx_order_status' 
      AND object_id = OBJECT_ID('dbo.payment_transactions')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_pay_tx_order_status 
    ON dbo.payment_transactions(order_id, status);
END;
GO


-- G. payos_webhook_events: Idempotent processing log for incoming provider signals
-- ============================================================================
-- WEBHOOK IDEMPOTENCY & DEDUPLICATION:
-- 1. payload_hash is globally unique and serves as the deduplication key.
-- 2. The first delivery creates the event record in RECEIVED status.
-- 3. Subsequent duplicate deliveries violate uq_webhook_payload_hash and fail on insert.
-- 4. Future service layer catches this key collision, reads the processed record,
--    and returns success without duplicate ledger journal execution.
-- ============================================================================
IF OBJECT_ID(N'dbo.payos_webhook_events', N'U') IS NULL
BEGIN
    PRINT 'Creating table payos_webhook_events...';
    CREATE TABLE dbo.payos_webhook_events (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        provider_event_id VARCHAR(150) NULL,
        payload_hash VARCHAR(64) NOT NULL,
        payment_transaction_id INT NULL,
        provider_order_code BIGINT NULL,
        payment_link_id VARCHAR(100) NULL,
        provider_reference VARCHAR(150) NULL,
        processing_status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED', -- 'RECEIVED', 'PROCESSED', 'REJECTED', 'FAILED'
        received_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        processed_at DATETIME2 NULL,
        failure_code VARCHAR(50) NULL,
        failure_reason NVARCHAR(500) NULL,
        CONSTRAINT uq_webhook_payload_hash UNIQUE (payload_hash),
        CONSTRAINT chk_webhook_status CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'REJECTED', 'FAILED')),
        CONSTRAINT fk_webhook_events_tx FOREIGN KEY (payment_transaction_id) REFERENCES dbo.payment_transactions(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'uq_webhook_event_id' 
      AND object_id = OBJECT_ID('dbo.payos_webhook_events')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_webhook_event_id 
    ON dbo.payos_webhook_events(provider_event_id) 
    WHERE provider_event_id IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_webhook_events_tx' 
      AND object_id = OBJECT_ID('dbo.payos_webhook_events')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_webhook_events_tx 
    ON dbo.payos_webhook_events(payment_transaction_id);
END;
GO


-- H. refunds: Order-level refunds tracked manually by admin
-- ============================================================================
-- FINANCIAL & SERVICE-LAYER RULES FOR REFUNDS:
-- 1. A refund may be created only when the order-level return reaches the APPROVED state defined by the order lifecycle.
-- 2. Refund amount_paid_to_refund must equal or be bounded by the customer amount actually paid.
-- 3. Refund amount and store earnings reversal amount are not assumed to be equal (e.g. platform co-funding offsets).
-- 4. COD and PayOS refunds use the same model but vary in evidence validation.
-- 5. Admin cannot transition status to COMPLETED without transaction_reference and evidence_storage_key.
-- 6. Duplicate execution calls are rejected or return the existing completed record.
-- 7. Refund completion automatically records reversal journals.
-- 8. Existing order return reason fields are read-only snapshots and must not be overwritten.
-- ============================================================================
IF OBJECT_ID(N'dbo.refunds', N'U') IS NULL
BEGIN
    PRINT 'Creating table refunds...';
    CREATE TABLE dbo.refunds (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        payment_transaction_id INT NULL,
        amount_paid_to_refund DECIMAL(12,0) NOT NULL,
        store_earnings_reversal_amount DECIMAL(12,0) NOT NULL,
        commission_reversal_amount DECIMAL(12,0) NOT NULL,
        platform_promotion_reversal_amount DECIMAL(12,0) NOT NULL,
        store_promotion_reversal_amount DECIMAL(12,0) NOT NULL,
        return_status_snapshot VARCHAR(30) NULL,
        return_reason_code_snapshot VARCHAR(100) NULL,
        return_reason_snapshot NVARCHAR(500) NULL,
        return_reviewed_at_snapshot DATETIME2 NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ACTION_REQUIRED', 'CANCELLED'
        reason NVARCHAR(500) NULL,
        idempotency_key VARCHAR(100) NOT NULL,
        transaction_reference VARCHAR(100) NULL,
        evidence_storage_key VARCHAR(200) NULL,
        evidence_original_name NVARCHAR(255) NULL,
        evidence_content_type VARCHAR(100) NULL,
        processed_by INT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        processing_at DATETIME2 NULL,
        completed_at DATETIME2 NULL,
        failed_at DATETIME2 NULL,
        cancelled_at DATETIME2 NULL,
        failure_reason NVARCHAR(500) NULL,
        version INT NOT NULL DEFAULT 0,
        CONSTRAINT uq_refunds_order UNIQUE (order_id),
        CONSTRAINT uq_refunds_idempotency UNIQUE (idempotency_key),
        CONSTRAINT chk_refunds_amount CHECK (amount_paid_to_refund > 0),
        CONSTRAINT chk_refunds_store_reversal CHECK (store_earnings_reversal_amount >= 0),
        CONSTRAINT chk_refunds_comm_reversal CHECK (commission_reversal_amount >= 0),
        CONSTRAINT chk_refunds_plat_promo_reversal CHECK (platform_promotion_reversal_amount >= 0),
        CONSTRAINT chk_refunds_store_promo_reversal CHECK (store_promotion_reversal_amount >= 0),
        CONSTRAINT chk_refunds_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ACTION_REQUIRED', 'CANCELLED')),
        CONSTRAINT chk_refunds_version CHECK (version >= 0),
        CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT fk_refunds_tx FOREIGN KEY (payment_transaction_id) REFERENCES dbo.payment_transactions(id),
        CONSTRAINT fk_refunds_processed_by FOREIGN KEY (processed_by) REFERENCES dbo.users(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_refunds_status_created' 
      AND object_id = OBJECT_ID('dbo.refunds')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_refunds_status_created 
    ON dbo.refunds(status, created_at);
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_refunds_tx' 
      AND object_id = OBJECT_ID('dbo.refunds')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_refunds_tx 
    ON dbo.refunds(payment_transaction_id);
END;
GO


-- I. payouts: Store owner balance payouts handled manually by system Admin
-- ============================================================================
-- SECURITY NOTE:
-- Bank account fields (bank_name, account_number, account_name) constitute
-- sensitive financial data. Access must be restricted via appropriate RBAC.
-- ============================================================================
IF OBJECT_ID(N'dbo.payouts', N'U') IS NULL
BEGIN
    PRINT 'Creating table payouts...';
    CREATE TABLE dbo.payouts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        store_id INT NOT NULL,
        amount DECIMAL(12,0) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
        idempotency_key VARCHAR(100) NOT NULL,
        bank_name NVARCHAR(100) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_name NVARCHAR(120) NOT NULL,
        transaction_reference VARCHAR(100) NULL,
        evidence_storage_key VARCHAR(200) NULL,
        evidence_original_name NVARCHAR(255) NULL,
        evidence_content_type VARCHAR(100) NULL,
        requested_by INT NULL,
        processed_by INT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        processing_at DATETIME2 NULL,
        completed_at DATETIME2 NULL,
        failed_at DATETIME2 NULL,
        cancelled_at DATETIME2 NULL,
        failure_reason NVARCHAR(500) NULL,
        version INT NOT NULL DEFAULT 0,
        CONSTRAINT uq_payouts_idempotency UNIQUE (idempotency_key),
        CONSTRAINT chk_payouts_amount CHECK (amount > 0),
        CONSTRAINT chk_payouts_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
        CONSTRAINT chk_payouts_version CHECK (version >= 0),
        CONSTRAINT fk_payouts_store FOREIGN KEY (store_id) REFERENCES dbo.stores(id),
        CONSTRAINT fk_payouts_requested_by FOREIGN KEY (requested_by) REFERENCES dbo.users(id),
        CONSTRAINT fk_payouts_processed_by FOREIGN KEY (processed_by) REFERENCES dbo.users(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_payouts_store_status' 
      AND object_id = OBJECT_ID('dbo.payouts')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_payouts_store_status 
    ON dbo.payouts(store_id, status);
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_payouts_status_created' 
      AND object_id = OBJECT_ID('dbo.payouts')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_payouts_status_created 
    ON dbo.payouts(status, created_at);
END;
GO


-- J. financial_journals: Double-entry immutable journal log
-- ============================================================================
-- FINANCIAL LEDGER INVARIANTS:
-- 1. Every journal entry is immutable. There is no delete or update.
-- 2. Journal status transitions are prohibited. Corrections require reversals.
-- 3. The service layer must validate sum of debits equals sum of credits before saving.
-- ============================================================================
IF OBJECT_ID(N'dbo.financial_journals', N'U') IS NULL
BEGIN
    PRINT 'Creating table financial_journals...';
    CREATE TABLE dbo.financial_journals (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        business_event_type VARCHAR(50) NOT NULL, -- 'ORDER_PAID', 'REFUND_COMPLETED', 'PAYOUT_COMPLETED'
        business_reference VARCHAR(150) NOT NULL, -- UNIQUE BUSINESS IDEMPOTENCY KEY
        order_id INT NULL,
        payment_transaction_id INT NULL,
        refund_id INT NULL,
        payout_id INT NULL,
        promotion_id INT NULL,
        reversal_of_journal_id BIGINT NULL,
        description NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by INT NULL,
        CONSTRAINT uq_journal_business_ref UNIQUE (business_reference),
        CONSTRAINT fk_journal_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT fk_journal_tx FOREIGN KEY (payment_transaction_id) REFERENCES dbo.payment_transactions(id),
        CONSTRAINT fk_journal_refund FOREIGN KEY (refund_id) REFERENCES dbo.refunds(id),
        CONSTRAINT fk_journal_payout FOREIGN KEY (payout_id) REFERENCES dbo.payouts(id),
        CONSTRAINT fk_journal_promotion FOREIGN KEY (promotion_id) REFERENCES dbo.promotions(id),
        CONSTRAINT fk_journal_reversal FOREIGN KEY (reversal_of_journal_id) REFERENCES dbo.financial_journals(id),
        CONSTRAINT fk_journal_creator FOREIGN KEY (created_by) REFERENCES dbo.users(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_journals_event' 
      AND object_id = OBJECT_ID('dbo.financial_journals')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_journals_event 
    ON dbo.financial_journals(business_event_type);
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_journals_order' 
      AND object_id = OBJECT_ID('dbo.financial_journals')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_journals_order 
    ON dbo.financial_journals(order_id);
END;
GO


-- K. financial_postings: Postings mapping debit and credit balances
-- ============================================================================
-- POSTING ACCOUNT OWNER INVARIANTS:
-- 1. account_owner_type must be PLATFORM or STORE.
-- 2. If owner is PLATFORM: account_owner_id must be NULL.
-- 3. If owner is STORE: account_owner_id and store_id must be NOT NULL and equal.
-- 4. Debits/credits must be positive; exactly one side is active.
-- 5. Currency is restricted to VND.
-- ============================================================================
IF OBJECT_ID(N'dbo.financial_postings', N'U') IS NULL
BEGIN
    PRINT 'Creating table financial_postings...';
    CREATE TABLE dbo.financial_postings (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        journal_id BIGINT NOT NULL,
        account_code VARCHAR(50) NOT NULL, -- 'CASH_RECEIVABLE', 'STORE_PAYABLE', 'PLATFORM_COMMISSION', 'PLATFORM_PROMO_EXPENSE'
        account_owner_type VARCHAR(30) NOT NULL, -- 'PLATFORM', 'STORE'
        account_owner_id INT NULL,
        store_id INT NULL,
        debit_amount DECIMAL(12,0) NOT NULL,
        credit_amount DECIMAL(12,0) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'VND',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT chk_postings_amounts CHECK (debit_amount >= 0 AND credit_amount >= 0),
        CONSTRAINT chk_postings_direction CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)),
        CONSTRAINT chk_postings_currency CHECK (currency = 'VND'),
        CONSTRAINT chk_postings_owner_type CHECK (account_owner_type IN ('PLATFORM', 'STORE')),
        CONSTRAINT chk_postings_owner_consistency CHECK (
            (account_owner_type = 'PLATFORM' AND account_owner_id IS NULL) OR
            (account_owner_type = 'STORE' AND account_owner_id IS NOT NULL AND store_id IS NOT NULL AND account_owner_id = store_id)
        ),
        CONSTRAINT fk_postings_journal FOREIGN KEY (journal_id) REFERENCES dbo.financial_journals(id),
        CONSTRAINT fk_postings_store FOREIGN KEY (store_id) REFERENCES dbo.stores(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_postings_journal' 
      AND object_id = OBJECT_ID('dbo.financial_postings')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_postings_journal 
    ON dbo.financial_postings(journal_id);
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_postings_store_account' 
      AND object_id = OBJECT_ID('dbo.financial_postings')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_postings_store_account 
    ON dbo.financial_postings(store_id, account_code);
END;
GO


-- L. store_balances: Balance projection cache calculated from postings
IF OBJECT_ID(N'dbo.store_balances', N'U') IS NULL
BEGIN
    PRINT 'Creating table store_balances...';
    CREATE TABLE dbo.store_balances (
        store_id INT PRIMARY KEY,
        pending_balance DECIMAL(12,0) NOT NULL DEFAULT 0,
        available_balance DECIMAL(12,0) NOT NULL DEFAULT 0,
        reserved_balance DECIMAL(12,0) NOT NULL DEFAULT 0,
        commission_receivable_balance DECIMAL(12,0) NOT NULL CONSTRAINT df_store_bal_comm_rec DEFAULT 0,
        version INT NOT NULL DEFAULT 0,
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        last_reconciled_at DATETIME2 NULL,
        CONSTRAINT chk_store_bal_version CHECK (version >= 0),
        CONSTRAINT chk_store_bal_comm_rec CHECK (commission_receivable_balance >= 0),
        CONSTRAINT fk_store_bal_store FOREIGN KEY (store_id) REFERENCES dbo.stores(id)
    );
END;
GO

-- Idempotent column addition for commission_receivable_balance
IF OBJECT_ID(N'dbo.store_balances', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.store_balances', N'commission_receivable_balance') IS NULL
    BEGIN
        PRINT 'Adding column store_balances.commission_receivable_balance...';
        ALTER TABLE dbo.store_balances ADD commission_receivable_balance DECIMAL(12,0) NOT NULL 
            CONSTRAINT df_store_bal_comm_rec DEFAULT 0 WITH VALUES;
    END;
END;
GO

-- Idempotent check constraint for commission_receivable_balance
IF OBJECT_ID(N'dbo.store_balances', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT * FROM sys.check_constraints 
        WHERE name = 'chk_store_bal_comm_rec' 
          AND parent_object_id = OBJECT_ID('dbo.store_balances')
    )
    BEGIN
        PRINT 'Adding constraint chk_store_bal_comm_rec...';
        ALTER TABLE dbo.store_balances ADD CONSTRAINT chk_store_bal_comm_rec 
        CHECK (commission_receivable_balance >= 0);
    END;
END;
GO


-- M. financial_reconciliation_issues: Flagging audit discrepancies for Admin review
IF OBJECT_ID(N'dbo.financial_reconciliation_issues', N'U') IS NULL
BEGIN
    PRINT 'Creating table financial_reconciliation_issues...';
    CREATE TABLE dbo.financial_reconciliation_issues (
        id INT IDENTITY(1,1) PRIMARY KEY,
        rule_code VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_reference VARCHAR(150) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'NEEDS_REVIEW', -- 'MATCHED', 'MISMATCH', 'NEEDS_REVIEW', 'RESOLVED'
        expected_amount DECIMAL(12,0) NULL,
        actual_amount DECIMAL(12,0) NULL,
        description NVARCHAR(500) NOT NULL,
        detected_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        resolved_at DATETIME2 NULL,
        resolved_by INT NULL,
        resolution_note NVARCHAR(500) NULL,
        CONSTRAINT chk_reconciliation_status CHECK (status IN ('MATCHED', 'MISMATCH', 'NEEDS_REVIEW', 'RESOLVED')),
        CONSTRAINT fk_reconciliation_resolved_by FOREIGN KEY (resolved_by) REFERENCES dbo.users(id)
    );
END;
GO

-- Lookup index: Check for reconciliation status and rules without blocking historical matched items
-- ============================================================================
-- AUDIT & RECONCILIATION INTEGRITY:
-- 1. Reconciliation does not silently rewrite financial history.
-- 2. Future service logic must avoid duplicate MISMATCH/NEEDS_REVIEW issues transactionally.
-- ============================================================================
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_reconciliation_entity_status' 
      AND object_id = OBJECT_ID('dbo.financial_reconciliation_issues')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_reconciliation_entity_status 
    ON dbo.financial_reconciliation_issues(rule_code, entity_type, entity_reference, status);
END;
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_reconciliation_status_rule' 
      AND object_id = OBJECT_ID('dbo.financial_reconciliation_issues')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_reconciliation_status_rule 
    ON dbo.financial_reconciliation_issues(status, rule_code, detected_at);
END;
GO

PRINT 'Database patch 22 completed successfully.';
GO
