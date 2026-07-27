-- SQL Patch: Create password_histories and security_audits tables, seed current passwords
-- Date: 2026-06-18

USE GreenLife;
GO

-- 1. Create password_histories table
IF OBJECT_ID('password_histories', 'U') IS NULL
BEGIN
    CREATE TABLE password_histories (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_histories_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

-- 2. Create security_audits table
IF OBJECT_ID('security_audits', 'U') IS NULL
BEGIN
    CREATE TABLE security_audits (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        details NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_security_audits_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

-- 3. Seed current user passwords into password_histories to prevent immediate reuse
-- Check if we have already seeded to prevent duplicate inserts on re-runs
IF EXISTS (SELECT * FROM users) AND NOT EXISTS (SELECT * FROM password_histories)
BEGIN
    INSERT INTO password_histories(user_id, password_hash)
    SELECT id, password_hash
    FROM users;
END
GO
