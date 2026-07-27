-- SQL Patch: Create notifications table
-- Date: 2026-06-18

USE GreenLife;
GO

IF OBJECT_ID('notifications', 'U') IS NOT NULL
BEGIN
    DROP TABLE notifications;
END

CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id INT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    read_at DATETIME2 NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type CHECK (type IN (
        'ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_SHIPPING', 'ORDER_DELIVERED', 
        'ORDER_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'REVIEW_HIDDEN', 
        'WISHLIST_RESTOCK', 'SYSTEM_ANNOUNCEMENT'
    )),
    CONSTRAINT chk_notifications_ref_type CHECK (reference_type IN (
        'ORDER', 'PAYMENT', 'REVIEW', 'PLANT', 'STORE', 'SYSTEM'
    ))
);

CREATE INDEX ix_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX ix_notifications_user_is_read ON notifications(user_id, is_read);
GO
