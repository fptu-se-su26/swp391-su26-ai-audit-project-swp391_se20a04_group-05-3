-- SQL Patch 27: Fix notifications.type CHECK constraint to support store approval workflow
-- Date: 2026-07-29
-- Targeted Issue: Admin Store Approval transaction failure caused by missing STORE_APPROVED and STORE_REJECTED in chk_notifications_type

SET NOCOUNT ON;
GO

PRINT 'Starting database patch 27: Fix notifications.type CHECK constraint for store approval...';
GO

-- 1. Drop existing CHECK constraint chk_notifications_type on dbo.notifications if it exists
IF OBJECT_ID(N'dbo.chk_notifications_type', N'C') IS NOT NULL
BEGIN
    PRINT 'Dropping existing constraint dbo.chk_notifications_type...';
    ALTER TABLE dbo.notifications DROP CONSTRAINT chk_notifications_type;
END;
GO

-- 2. Recreate constraint chk_notifications_type containing all NotificationType enum values
PRINT 'Recreating constraint dbo.chk_notifications_type with STORE_APPROVED and STORE_REJECTED...';
ALTER TABLE dbo.notifications ADD CONSTRAINT chk_notifications_type CHECK (type IN (
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'ORDER_SHIPPING',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'REVIEW_HIDDEN',
    'WISHLIST_RESTOCK',
    'SYSTEM_ANNOUNCEMENT',
    'BOOKING_CREATED',
    'BOOKING_CONFIRMED',
    'BOOKING_IN_PROGRESS',
    'BOOKING_COMPLETED',
    'BOOKING_CANCELLED',
    'STORE_APPROVED',
    'STORE_REJECTED'
));
GO

PRINT 'Patch 27 applied successfully.';
GO
