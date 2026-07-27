-- SQL Patch: patch_11_auth_schema_alignment.sql
-- Date: 2026-06-27
-- Description: Align DB schema with User.java, UserOtp.java, and RefreshToken.java entities.

-- 1. Add missing columns to users table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'failed_login_attempts')
BEGIN
    ALTER TABLE users ADD failed_login_attempts INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'lockout_end')
BEGIN
    ALTER TABLE users ADD lockout_end DATETIME2 NULL;
END
GO

-- 2. Drop and recreate users status check constraint
IF EXISTS (
    SELECT * 
    FROM sys.objects 
    WHERE parent_object_id = OBJECT_ID('users') AND name = 'chk_users_status' AND type = 'C'
)
BEGIN
    ALTER TABLE users DROP CONSTRAINT chk_users_status;
END
GO

ALTER TABLE users ADD CONSTRAINT chk_users_status 
CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'DISABLED'));
GO

-- 3. Create user_otps table
IF OBJECT_ID('user_otps', 'U') IS NULL
BEGIN
    CREATE TABLE user_otps (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        otp_hash VARCHAR(64) NOT NULL,
        purpose VARCHAR(30) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        expires_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_user_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_user_otps_purpose CHECK (purpose IN ('VERIFICATION', 'PASSWORD_RESET'))
    );

    CREATE INDEX ix_user_otps_user_id ON user_otps(user_id);
END
GO

-- 4. Create refresh_tokens table
IF OBJECT_ID('refresh_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE refresh_tokens (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME2 NOT NULL,
        revoked BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens(user_id);
END
GO
