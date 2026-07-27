-- SQL Patch: Add snapshot, timestamp, and version fields to bookings table
-- Date: 2026-06-20

USE GreenLife;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'service_name_snapshot')
BEGIN
    ALTER TABLE bookings ADD service_name_snapshot NVARCHAR(150) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'service_price_snapshot')
BEGIN
    ALTER TABLE bookings ADD service_price_snapshot DECIMAL(12,0) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'store_name_snapshot')
BEGIN
    ALTER TABLE bookings ADD store_name_snapshot NVARCHAR(150) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'confirmed_at')
BEGIN
    ALTER TABLE bookings ADD confirmed_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'started_at')
BEGIN
    ALTER TABLE bookings ADD started_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'completed_at')
BEGIN
    ALTER TABLE bookings ADD completed_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'cancelled_at')
BEGIN
    ALTER TABLE bookings ADD cancelled_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'version')
BEGIN
    ALTER TABLE bookings ADD version BIGINT NOT NULL DEFAULT 0;
END
GO

-- Alter notifications.type check constraint
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('chk_notifications_type') AND type = 'C')
BEGIN
    ALTER TABLE notifications DROP CONSTRAINT chk_notifications_type;
END
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type CHECK (type IN (
    'ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_SHIPPING', 'ORDER_DELIVERED', 
    'ORDER_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'REVIEW_HIDDEN', 
    'WISHLIST_RESTOCK', 'SYSTEM_ANNOUNCEMENT',
    'BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_IN_PROGRESS', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED'
));
GO

-- Alter notifications.reference_type check constraint
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('chk_notifications_ref_type') AND type = 'C')
BEGIN
    ALTER TABLE notifications DROP CONSTRAINT chk_notifications_ref_type;
END
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_ref_type CHECK (reference_type IN (
    'ORDER', 'PAYMENT', 'REVIEW', 'PLANT', 'STORE', 'SYSTEM', 'BOOKING'
));
GO

-- Alter bookings.status check constraint
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('chk_bookings_status') AND type = 'C')
BEGIN
    ALTER TABLE bookings DROP CONSTRAINT chk_bookings_status;
END
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
GO
