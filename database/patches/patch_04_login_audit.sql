-- SQL Patch: Create login_audits table, add user login columns, create indices
-- Date: 2026-06-18

USE GreenLife;
GO

-- 1. Add columns to users table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_login_at')
BEGIN
    ALTER TABLE users ADD last_login_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_login_ip')
BEGIN
    ALTER TABLE users ADD last_login_ip VARCHAR(100) NULL;
END
GO

-- 2. Create login_audits table
IF OBJECT_ID('login_audits', 'U') IS NULL
BEGIN
    CREATE TABLE login_audits (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        email VARCHAR(255) NOT NULL,
        success BIT NOT NULL,
        ip_address VARCHAR(100) NULL,
        user_agent NVARCHAR(500) NULL, -- Hardened to max 500 characters
        failure_reason VARCHAR(255) NULL,
        login_time DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_login_audits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
END
ELSE
BEGIN
    -- Hardening column size if table already exists
    ALTER TABLE login_audits ALTER COLUMN user_agent NVARCHAR(500) NULL;
END
GO

-- 3. Alter security_audits table to allow nullable user_id and add email and suspicious_activity_type columns
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'security_audits')
BEGIN
    -- Drop old foreign key constraint if it exists
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_security_audits_user')
    BEGIN
        ALTER TABLE security_audits DROP CONSTRAINT fk_security_audits_user;
    END

    ALTER TABLE security_audits ALTER COLUMN user_id INT NULL;

    -- Recreate constraint with ON DELETE SET NULL
    ALTER TABLE security_audits
    ADD CONSTRAINT fk_security_audits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('security_audits') AND name = 'email')
    BEGIN
        ALTER TABLE security_audits ADD email VARCHAR(255) NULL;
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('security_audits') AND name = 'suspicious_activity_type')
    BEGIN
        ALTER TABLE security_audits ADD suspicious_activity_type VARCHAR(50) NULL;
    END
END
GO

-- 4. Create indices
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_login_audits_email' AND object_id = OBJECT_ID('login_audits'))
BEGIN
    CREATE INDEX IX_login_audits_email ON login_audits(email);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_login_audits_login_time' AND object_id = OBJECT_ID('login_audits'))
BEGIN
    CREATE INDEX IX_login_audits_login_time ON login_audits(login_time);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_login_audits_user_id' AND object_id = OBJECT_ID('login_audits'))
BEGIN
    CREATE INDEX IX_login_audits_user_id ON login_audits(user_id);
END
GO

-- 5. Create composite index for brute-force monitoring query optimization
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_login_audits_email_success_time' AND object_id = OBJECT_ID('login_audits'))
BEGIN
    CREATE INDEX IX_login_audits_email_success_time ON login_audits(email, success, login_time);
END
GO

