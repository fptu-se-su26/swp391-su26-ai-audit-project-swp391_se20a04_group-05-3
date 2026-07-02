# Module 1A Sprint 1: Database Migration Plan
**Author**: Senior Spring Boot Technical Lead & Database Designer  
**Date**: June 2026  
**Target Project**: GreenLife (swp391-su26-ai-audit-project-swp391_se20a04_group-05-3)

This document details the database migration design and SQL scripts required to prepare the SQL Server database for **Module 1A - Authentication Core**.

---

## 1. Current Database State

The schema is defined in `database/greenlife.sql`. The tables relevant to authentication are audited below:

### 1.1 `roles` Table
* **Columns**:
  * `id` (`INT IDENTITY(1,1) PRIMARY KEY`)
  * `name` (`VARCHAR(30) NOT NULL UNIQUE`)
  * `description` (`NVARCHAR(255) NULL`)
  * `created_at` (`DATETIME2 NOT NULL DEFAULT SYSDATETIME()`)
* **Constraints**:
  * `chk_roles_name CHECK (name IN ('ADMIN', 'STORE_OWNER', 'CUSTOMER'))`
* **Indexes**: Primary Key clustered index.

### 1.2 `users` Table
* **Columns**:
  * `id` (`INT IDENTITY(1,1) PRIMARY KEY`)
  * `full_name` (`NVARCHAR(120) NOT NULL`)
  * `email` (`VARCHAR(150) NOT NULL UNIQUE`)
  * `password_hash` (`VARCHAR(255) NOT NULL`)
  * `phone` (`VARCHAR(20) NULL`)
  * `address` (`NVARCHAR(255) NULL`)
  * `avatar_url` (`NVARCHAR(500) NULL`)
  * `role_id` (`INT NOT NULL`)
  * `status` (`VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'`)
  * `email_verified` (`BIT NOT NULL DEFAULT 0`)
  * `created_at` (`DATETIME2 NOT NULL DEFAULT SYSDATETIME()`)
  * `updated_at` (`DATETIME2 NULL`)
* **Constraints**:
  * `fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id)`
  * `chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'PENDING_APPROVAL'))`
* **Indexes**: Primary Key clustered index, Unique index on `email`.

---

## 2. Migration SQL Design (SQL Server Dialect)

The migration script applies status constraint updates, appends lockout tracking columns, and creates OTP/session tables.

```sql
-- ==========================================
-- SPRINT 1 DATABASE MIGRATION SCRIPT
-- ==========================================

-- A. Users Table Updates
-- 1. Add failed login counter and lockout expiration datetime fields
ALTER TABLE users ADD failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD lockout_end DATETIME2 NULL;
GO

-- 2. Drop the existing status CHECK constraint
ALTER TABLE users DROP CONSTRAINT chk_users_status;
GO

-- 3. Create the new status CHECK constraint containing PENDING_VERIFICATION and DISABLED
ALTER TABLE users ADD CONSTRAINT chk_users_status 
    CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'DISABLED'));
GO


-- B. Create user_otps Table
-- 1. Create table structure
CREATE TABLE user_otps (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'VERIFICATION',
    attempts INT NOT NULL DEFAULT 0,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_otps_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_otps_purpose CHECK (purpose IN ('VERIFICATION'))
);
GO

-- 2. Create index for fast lookups
CREATE NONCLUSTERED INDEX idx_otps_user_purpose ON user_otps (user_id, purpose, expires_at);
GO


-- C. Create refresh_tokens Table
-- 1. Create table structure
CREATE TABLE refresh_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    revoked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_refresh_tokens_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- 2. Create unique index on token hash for validation checks
CREATE UNIQUE NONCLUSTERED INDEX idx_refresh_tokens_hash ON refresh_tokens (token_hash);
GO

-- 3. Create index on user_id for session revocation queries
CREATE NONCLUSTERED INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
GO
```

---

## 3. Rollback Scripts

Use this script to revert database changes in case of an issue:

```sql
-- ==========================================
-- SPRINT 1 ROLLBACK SCRIPT
-- ==========================================

-- 1. Drop user_otps table and associated index
IF OBJECT_ID('dbo.user_otps', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.user_otps;
END
GO

-- 2. Drop refresh_tokens table and associated indexes
IF OBJECT_ID('dbo.refresh_tokens', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.refresh_tokens;
END
GO

-- 3. Revert users table changes
-- Drop failed_login_attempts & lockout_end
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'failed_login_attempts')
BEGIN
    ALTER TABLE dbo.users DROP COLUMN failed_login_attempts;
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'lockout_end')
BEGIN
    ALTER TABLE dbo.users DROP COLUMN lockout_end;
END
GO

-- Revert check constraint status to original values
IF EXISTS (SELECT * FROM sys.objects WHERE parent_object_id = OBJECT_ID('dbo.users') AND name = 'chk_users_status' AND type = 'C')
BEGIN
    ALTER TABLE dbo.users DROP CONSTRAINT chk_users_status;
END
GO

ALTER TABLE dbo.users ADD CONSTRAINT chk_users_status 
    CHECK (status IN ('ACTIVE', 'LOCKED', 'PENDING_APPROVAL'));
GO
```

---

## 4. Data Compatibility Review

A compatibility review was performed to ensure zero impact on existing seed datasets:
1. **Existing User Statuses**: Currently, seeded users (e.g., `vip.customer@greenlife.vn`, `nursery.partner@greenlife.vn`, and admin accounts) are stored with `status = 'ACTIVE'`. Since `'ACTIVE'` remains in the new status check constraint, these accounts remain valid.
2. **Missing Statuses**: The status `'PENDING_APPROVAL'` was part of the original check constraint, but is not present in the new authentication core constraint. We must verify if any existing user in the database uses this status. 
   * *Audit Result*: No seeded user accounts in `greenlife.sql` use `'PENDING_APPROVAL'`. It was designed for store onboarding status, which belongs to the `stores` table rather than the `users` table. Thus, removing it does not cause validation failures.
3. **Role Mappings**: Roles are assigned via `role_id` referencing the `roles` table. The `roles` table schema and values remain unchanged, so existing role associations are unaffected.

---

## 5. Migration Risk Assessment

The database migration risk is classified as **LOW**:
* **Data Mutation**: There are no modifications to existing column data types or column deletions. Adding columns with default values (`DEFAULT 0` for `failed_login_attempts`) prevents null constraint violations on existing records.
* **Service Downtime**: Altering check constraints and creating tables is metadata-only, executing in milliseconds on SQL Server.
* **Integrity Constraints**: The addition of foreign key cascading deletes (`ON DELETE CASCADE`) ensures that deleting a user automatically cleans up their associated OTPs and refresh sessions, preventing orphaned records.

---

## 6. Verification Checklist

Execute the following SQL queries to verify the migration was successful:

### 6.1 Verify Table and Column Structures
```sql
-- Check users columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('failed_login_attempts', 'lockout_end');

-- Check existence of user_otps and refresh_tokens
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('user_otps', 'refresh_tokens');
```

### 6.2 Verify Check Constraints
```sql
-- View all check constraints on the users table
SELECT name, definition 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('users');
```

### 6.3 Verify Index Deployments
```sql
-- View indexes on user_otps and refresh_tokens
SELECT t.name AS TableName, i.name AS IndexName, i.type_desc AS IndexType
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('user_otps', 'refresh_tokens');
```
