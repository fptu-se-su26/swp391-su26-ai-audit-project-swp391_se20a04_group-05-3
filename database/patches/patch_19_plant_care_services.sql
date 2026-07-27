-- SQL Patch: Add customer_phone field to bookings table
-- Date: 2026-07-14
-- Reason: To store booking-specific customer contact numbers for Plant Care Services.

USE GreenLife;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'customer_phone')
BEGIN
    ALTER TABLE bookings ADD customer_phone VARCHAR(20) NULL;
END
GO
