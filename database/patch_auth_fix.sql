-- Safe patch script to convert seed user passwords to valid BCrypt hashes.
-- This allows logging in with the default password: 123456

USE GreenLife;
GO

UPDATE users
SET password_hash = '$2a$10$oWcuptB.fH5LCqjb4tOIt.MgMmnPGfL5gsehWloStVtCU5IhAf9Pq'
WHERE password_hash = 'DEMO_BCRYPT_HASH';
GO
