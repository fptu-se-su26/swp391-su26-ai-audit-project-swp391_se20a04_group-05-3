# Module 1A: Authentication Core GAP Analysis
**Author**: Senior Spring Boot Solution Architect & Technical Auditor  
**Date**: June 2026  
**Target Project**: GreenLife (swp391-su26-ai-audit-project-swp391_se20a04_group-05-3)

---

## 1. Existing Authentication Inventory

This section audits the authentication components currently present in the codebase.

| Component | Exists | Status | Notes |
| :--- | :---: | :--- | :--- |
| **`User` Entity** | Yes | Needs Modification | Mapped to `users` table, contains status and email verification fields, but lacks lockout columns and Enum state mapping. |
| **`Role` Entity** | Yes | Reusable | Mapped to `roles` table. Fully functional for role mapping. |
| **`AuthController`** | Yes | Needs Modification | Handles registration and login, but lacks verify-otp, resend-otp, refresh-token, and logout endpoints. |
| **`AuthService`** | Yes | Needs Modification | Handles registration and login. Needs refactoring to support OTP generation, verification checks, and refresh token integration. |
| **`JwtService`** | Yes | Needs Modification | Handles token generation and extraction. Needs adjustment for short access token lifespans (15 mins) and key loading from configuration. |
| **`JwtAuthenticationFilter`** | Yes | Reusable | Properly intercepts requests and validates Bearer tokens. |
| **`SecurityConfig`** | Yes | Needs Modification | Lacks cookie refresh mappings and explicit paths for OTP endpoints. |
| **`RegisterRequest` DTO** | Yes | Needs Modification | Password length validation (6-50 chars) is weaker than the target spec (min 12 chars). |
| **`LoginRequest` DTO** | Yes | Reusable | Captures email and password correctly. |
| **`AuthResponse` DTO** | Yes | Needs Modification | Needs to incorporate updated user response structures and token objects. |
| **`UserResponse` DTO** | Yes | Needs Modification | Needs to expose `status` and `emailVerified` fields. |
| **`UserRepository`** | Yes | Reusable | Exposes standard find and checks queries. |
| **`RoleRepository`** | Yes | Reusable | Standard lookup repository. |

---

## 2. Database Gap Analysis

### 2.1 Audit of the `users` Table
* **Existing Columns**: `id`, `full_name`, `email`, `password_hash`, `phone`, `address`, `avatar_url`, `role_id`, `status` (default `'ACTIVE'`), `email_verified` (default `0`), `created_at`, `updated_at`.
* **Missing Columns**:
  * `failed_login_attempts` (`INT NOT NULL DEFAULT 0`)
  * `lockout_end` (`DATETIME NULL`)
* **Incorrect Constraints**:
  * The existing check constraint:
    ```sql
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'PENDING_APPROVAL'))
    ```
    does not permit `'PENDING_VERIFICATION'` or `'DISABLED'`. `'PENDING_APPROVAL'` is unused in the authentication core lifecycle.
  * **Remediation**: Drop and recreate the check constraint to allow: `('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'DISABLED')`.

### 2.2 Audit of New Tables
* **`user_otps`**: Completely **Missing**. Must be created to store hashed OTP codes, expiry dates, and usage counts.
* **`refresh_tokens`**: Completely **Missing**. Must be created to support Refresh Token Rotation (RTR) and session revocation.

### 2.3 Migration Impact Assessment
* Since the tables `user_otps` and `refresh_tokens` are new, there is no risk of data loss.
* Appending columns to `users` requires defaulting `failed_login_attempts` to 0. Since the existing status constraint will change, existing users (seeded as `"ACTIVE"`) will not violate the new status list because `"ACTIVE"` remains in the list. The migration risk is low.

---

## 3. Entity Gap Analysis

This section maps the JPA Entity discrepancies.

### 1. `User` Entity
* **Current State**: Uses primitive fields; `status` is represented as a plain String:
  ```java
  private String status = "ACTIVE";
  private Boolean emailVerified = false;
  ```
* **Required Changes**:
  * Add `@Column(name = "failed_login_attempts", nullable = false)` -> `private Integer failedLoginAttempts = 0`.
  * Add `@Column(name = "lockout_end")` -> `private LocalDateTime lockoutEnd`.
  * Refactor `status` from plain String to enum `UserStatus` (mapped as `@Enumerated(EnumType.STRING)`).
  * Enforce validations on profile updates.

### 2. `UserOtp` Entity
* **Current State**: **Missing**.
* **Required Changes**: Create a new class under `com.greenlife.entity` mapping `id`, `user_id`, `otp_hash`, `purpose`, `attempts`, `expires_at`, and `created_at`.

### 3. `RefreshToken` Entity
* **Current State**: **Missing**.
* **Required Changes**: Create a new class mapping token rotation fields (`id`, `user_id`, `token_hash`, `expires_at`, `revoked`, `created_at`).

---

## 4. Repository Gap Analysis

### 1. `UserRepository`
* **Current State**: Exposes basic CRUD methods.
* **Required Changes**: Reusable. No changes needed to basic queries. Add JPQL mapping for bulk status updates or locking if required by automated routines.

### 2. `UserOtpRepository`
* **Current State**: **Missing**.
* **Required Changes**: Create `UserOtpRepository` interface extending `JpaRepository<UserOtp, Long>`. Expose:
  * `Optional<UserOtp> findByUserIdAndPurpose(Integer userId, String purpose)`
  * `void deleteByExpiresAtBefore(LocalDateTime dateTime)` (for cleanups)

### 3. `RefreshTokenRepository`
* **Current State**: **Missing**.
* **Required Changes**: Create `RefreshTokenRepository` extending `JpaRepository<RefreshToken, Long>`. Expose:
  * `Optional<RefreshToken> findByTokenHash(String tokenHash)`
  * `void deleteByExpiresAtBefore(LocalDateTime dateTime)`
  * `void revokeAllUserTokens(Integer userId)` (to invalidate sessions on token theft detection)

---

## 5. Service Layer Gap Analysis

| Service Name | Current State | Action Required | Complexity Estimate |
| :--- | :--- | :--- | :---: |
| **`AuthService`** | Exists | Needs Refactor. Registration must not return tokens immediately; login must validate verification status and enforce lock limits. | Medium |
| **`JwtService`** | Exists | Needs Refactor. Update expiration properties to read short-lived configuration (15 mins). | Low |
| **`OtpService`** | Missing | Create new class implementing secure OTP generation, SHA-256 hashing, and verification retry counters. | Medium |
| **`RefreshTokenService`**| Missing | Create service handling token rotation, db persistence, cookie payload creation, and revocation logic. | High |
| **`EmailService`** | Missing | Create service using Spring's `JavaMailSender` to send OTP emails. | Low |

---

## 6. Security Architecture Gap Analysis

This section highlights weaknesses in the current MVP architecture:

### 1. Critical Issues
* **Immediate Token Access**: Users receive valid JWT access tokens upon registration without verifying their email address.
* **Lack of Token Revocation**: Logging out does not revoke the issued JWT token. The token remains valid until expiration.

### 2. High Priority Issues
* **Brute-Force Vulnerability**: The `login` endpoint does not track failed attempts, allowing brute-force attacks on credentials.
* **Security Role Prefix Mismatch**: Role names in database are `"CUSTOMER"`, `"ADMIN"`, `"STORE_OWNER"`. In `SecurityConfig`, authorize requests check `.hasRole("ADMIN")`. Spring Security looks for authority `"ROLE_ADMIN"`. While `User.java` prefixes `"ROLE_"` in `getAuthorities()`, any manual mapping in other filters might bypass this, presenting a security risk.

### 3. Medium Priority Issues
* **Hardcoded Credentials**: Mail server passwords, DB passwords, and JWT secret keys are defined in plain configuration files.
* **Weak Password Standard**: Passwords of length 6 are allowed, presenting a security vulnerability.

---

## 7. API Gap Analysis

This table audits endpoint availability:

| Endpoint | Exists | Missing Features | Action Required |
| :--- | :---: | :--- | :--- |
| **`POST /api/auth/register`** | Yes | Immediate token generation bypasses verification; weak validation. | Refactor: Change output to message DTO; trigger OTP email; save status as `PENDING_VERIFICATION`. |
| **`POST /api/auth/verify-otp`**| No | Entire feature is missing. | Create endpoint. |
| **`POST /api/auth/resend-otp`**| No | Entire feature is missing. | Create endpoint with rate-limiting. |
| **`POST /api/auth/login`** | Yes | Does not check if email is verified; lacks lockout checks; no refresh token cookie. | Refactor: Verify status is `ACTIVE`; set secure cookie; adjust return payload. |
| **`POST /api/auth/refresh`** | No | Refresh Token Rotation is missing. | Create endpoint. |
| **`POST /api/auth/logout`** | No | Session cookie deletion is missing. | Create endpoint. |
| **`GET /api/auth/me`** | Yes | Returns basic response. | Update mapping to include verified status. |

---

## 8. Implementation Order & Effort Estimation

Below is the step-by-step sequence required to implement Module 1A:

### Step 1: Database Migration
* **Risk**: Low (Add columns and tables, alter check constraint).
* **Dependencies**: Database active connection.
* **Estimated Effort**: 4 hours.

### Step 2: Entity Update
* **Risk**: Low (Create `UserOtp`, `RefreshToken`, modify `User`).
* **Dependencies**: Step 1.
* **Estimated Effort**: 4 hours.

### Step 3: Repository Creation
* **Risk**: Low (Create JPA repository classes and queries).
* **Dependencies**: Step 2.
* **Estimated Effort**: 2 hours.

### Step 4: Infrastructure Services
* **Risk**: Medium (Configure Spring Boot SMTP Mail Sender properties).
* **Dependencies**: Step 3.
* **Estimated Effort**: 6 hours.

### Step 5: OTP & Verification Services
* **Risk**: Medium (Implement Secure OTP hashing and limits).
* **Dependencies**: Step 4.
* **Estimated Effort**: 6 hours.

### Step 6: Token Rotation (RTR) Integration
* **Risk**: High (Setting secure HttpOnly cookies, managing rotation, implementing theft protection).
* **Dependencies**: Step 3.
* **Estimated Effort**: 12 hours.

### Step 7: AuthService Refactor
* **Risk**: Medium (Change registration and login states).
* **Dependencies**: Steps 5 and 6.
* **Estimated Effort**: 8 hours.

### Step 8: Controller Endpoint Updates
* **Risk**: Low (Expose REST mapping and request validation).
* **Dependencies**: Step 7.
* **Estimated Effort**: 6 hours.

### Step 9: Integration Testing
* **Risk**: Medium (Simulating email verify, logout, and token rotation).
* **Dependencies**: Steps 1-8.
* **Estimated Effort**: 8 hours.

---

## 9. Final Readiness Score

These scores estimate the completeness of the current codebase against the production-grade Module 1A specification:

* **Authentication Readiness**: **40%** (Basic registration and login work, but verification flows and status constraints are missing).
* **Database Readiness**: **50%** (The `users` table contains the status and email columns, but missing OTP/Refresh tables and lockout columns).
* **Security Readiness**: **20%** (Basic security filter works, but lacks refresh token cookies, OTP verification checks, brute-force locking, and token revocation).
* **Overall Module 1A Completion**: **36%**
