-- SQL Patch 28: Fix corrupted Vietnamese text in notifications
-- Date: 2026-07-30
-- Description: Idempotent patch to repair mojibake/corrupted Vietnamese strings in SQL Server DB

USE GreenLife;
GO

IF OBJECT_ID('notifications', 'U') IS NOT NULL
BEGIN
    -- 1. Fix corrupted order notifications for Store Owners (system-generated template)
    UPDATE notifications
    SET title = N'Có đơn hàng mới',
        message = N'Cửa hàng của bạn nhận được đơn hàng mới #' + CAST(reference_id AS NVARCHAR(20))
    WHERE type = 'ORDER_CREATED'
      AND user_id IN (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'STORE_OWNER'))
      AND (title LIKE N'%C?%' OR title LIKE N'%Cá»%' OR message LIKE N'%C?%' OR message LIKE N'%Cá»%');

    -- 2. Fix corrupted order notifications for Customers (system-generated template)
    UPDATE notifications
    SET title = N'Đơn hàng mới đã được tạo',
        message = N'Đơn hàng #' + CAST(reference_id AS NVARCHAR(20)) + N' của bạn đã được tạo thành công.'
    WHERE type = 'ORDER_CREATED'
      AND user_id IN (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'CUSTOMER'))
      AND (title LIKE N'%m?i%' OR title LIKE N'%mÃ%' OR message LIKE N'%du?c%' OR message LIKE N'%dá»±c%');

    -- 3. Fix corrupted order confirmation notifications (system-generated template)
    UPDATE notifications
    SET title = N'Đơn hàng đã được xác nhận',
        message = N'Đơn hàng #' + CAST(reference_id AS NVARCHAR(20)) + N' của bạn đã được xác nhận bởi cửa hàng.'
    WHERE type = 'ORDER_CONFIRMED'
      AND (title LIKE N'%x?c%' OR title LIKE N'%xÃ¡c%' OR message LIKE N'%x?c%' OR message LIKE N'%xÃ¡c%');

    -- 4. Fix corrupted payment success notifications (system-generated template)
    UPDATE notifications
    SET title = N'Thanh toán thành công',
        message = N'Giao dịch thanh toán cho đơn hàng #' + CAST(reference_id AS NVARCHAR(20)) + N' đã thành công.'
    WHERE type = 'PAYMENT_SUCCESS'
      AND (title LIKE N'%th?nh%' OR title LIKE N'%thÃ nh%' OR message LIKE N'%th?nh%' OR message LIKE N'%thÃ nh%');
END;
GO

-- NOTE ON UNRECOVERABLE / FREE-TEXT USER DATA:
-- User-entered store names, customer addresses, plant descriptions, and review comments
-- containing corrupted characters cannot be safely auto-reconstructed without data loss.
-- Those records must be reviewed manually or re-entered by their respective owners.
