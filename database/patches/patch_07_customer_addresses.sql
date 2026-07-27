-- SQL Patch: Create customer_addresses table
-- Date: 2026-06-20

USE GreenLife;
GO

IF OBJECT_ID('customer_addresses', 'U') IS NOT NULL
BEGIN
    DROP TABLE customer_addresses;
END

CREATE TABLE customer_addresses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    recipient_name NVARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line NVARCHAR(255) NOT NULL,
    ward NVARCHAR(100) NOT NULL,
    district NVARCHAR(100) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    is_default BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_customer_addresses_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ix_customer_addresses_customer_id ON customer_addresses(customer_id);
GO

CREATE UNIQUE INDEX uq_customer_addresses_default ON customer_addresses(customer_id) WHERE is_default = 1;
GO
