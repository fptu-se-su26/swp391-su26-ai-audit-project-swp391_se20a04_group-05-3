# Module 1A Sprint 2: Entity & Repository Design Specification
**Author**: Senior Spring Boot Solution Architect & Technical Auditor  
**Date**: June 2026  
**Target Project**: GreenLife (swp391-su26-ai-audit-project-swp391_se20a04_group-05-3)

This document provides the technical design specifications for the JPA Entities and Repositories of **Module 1A - Authentication Core**. It is designed as a direct implementation guide for backend developers.

---

## SECTION 1 — ENTITY AUDIT

An audit of the existing entities in the `greenlife-backend` project:

### 1. `User` Entity
* **Existing Fields**: `id` (`Integer`), `fullName` (`String`), `email` (`String`), `passwordHash` (`String`), `phone` (`String`), `address` (`String`), `avatarUrl` (`String`), `role` (`Role`), `status` (`String`), `emailVerified` (`Boolean`), `createdAt` (`LocalDateTime`), `updatedAt` (`LocalDateTime`).
* **Missing Fields**:
  * `failedLoginAttempts` (`Integer`)
  * `lockoutEnd` (`LocalDateTime`)
* **Required Modifications**:
  * Change `status` from `String` to enum type `UserStatus`. Mapped with `@Enumerated(EnumType.STRING)`.
  * Define column mapping `@Column(name = "failed_login_attempts", nullable = false)`.
  * Define column mapping `@Column(name = "lockout_end")`.
* **Risk Assessment**: **Low**. Adding columns with default values (`failedLoginAttempts` defaults to 0) does not impact existing data. Modifying `status` requires mapping it to `UserStatus`. Since all existing seeded accounts have `status = 'ACTIVE'`, they map directly to `UserStatus.ACTIVE`.

### 2. `Role` Entity
* **Existing Fields**: `id` (`Integer`), `name` (`String`), `description` (`String`), `createdAt` (`LocalDateTime`).
* **Missing Fields**: None.
* **Required Modifications**: Reusable as-is. No structural changes needed.
* **Risk Assessment**: **No Risk**.

---

## SECTION 2 — ENUM DESIGN

We define two enums under `com.greenlife.entity` (or a dedicated `com.greenlife.entity.enums` package) to restrict input values and secure database state.

### 1. `UserStatus`
Represents the account lifecycle state.

* **Values**:
  * `PENDING_VERIFICATION`: The user has registered but has not yet verified their email. Authentication is blocked.
  * `ACTIVE`: Email verified. Full access granted matching role authorizations.
  * `LOCKED`: Temporarily suspended due to 5 consecutive login failures.
  * `DISABLED`: Permanently deactivated by admin action.

#### State Transition Table

| Current State | Target State | Triggering Event | Authorized Actor | Business Rules / Side Effects |
| :--- | :--- | :--- | :---: | :--- |
| **None** | `PENDING_VERIFICATION` | User Registration | Anonymous | Persist user, generate and email OTP. |
| `PENDING_VERIFICATION` | `ACTIVE` | Successful OTP Verification | Anonymous | Set `emailVerified = true`, delete active OTPs. |
| `ACTIVE` | `LOCKED` | 5 Consecutive Login Failures | System | Set `lockoutEnd = LocalDateTime.now().plusMinutes(30)`. |
| `LOCKED` | `ACTIVE` | Lockout Expiration / Password Reset | System / User | Reset `failedLoginAttempts = 0`, clear `lockoutEnd`. |
| `ACTIVE` | `DISABLED` | Account Suspension | Admin | Terminate active sessions (delete refresh tokens). |
| `DISABLED` | `ACTIVE` | Account Re-enablement | Admin | Allow login access immediately. |

---

### 2. `OtpPurpose`
Defines the usage context of the generated OTP.

* **Values**:
  * `VERIFICATION`: Used to verify email during registration.
* **Extensibility (Future Proofing)**:
  * `PASSWORD_RESET`: Can be added later for forgot-password flows without changing database schema constraints (defined as `VARCHAR` in database, validation occurs via Java Enum constraints).
  * `EMAIL_CHANGE`: Can be added later to support updating contact emails.

---

## SECTION 3 — USER ENTITY DESIGN

Below is the complete specification for the `User` entity class, extending `UserDetails`.

### 1. Field Specification Table

| Field Name | Java Type | Database Column | Nullable | Validation Constraints | Default Value | Security Notes |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `Integer` | `id` | No | None | IDENTITY | Primary Key. |
| `fullName` | `String` | `full_name` | No | `@NotBlank`, `@Size(max=120)`| None | Mapped to NVARCHAR in database. |
| `email` | `String` | `email` | No | `@NotBlank`, `@Email`, `@Size(max=150)`| None | Case-insensitive unique identifier. |
| `passwordHash`| `String` | `password_hash` | No | `@NotBlank` | None | Stores BCrypt hashes. Never expose in DTOs. |
| `phone` | `String` | `phone` | Yes | `@Pattern(regexp="^$\\|[0-9]{10,11}")`| `NULL` | Encoded with length validations. |
| `address` | `String` | `address` | Yes | `@Size(max=255)` | `NULL` | User shipping address. |
| `avatarUrl` | `String` | `avatar_url` | Yes | `@Size(max=500)` | `NULL` | Link to public image asset storage. |
| `role` | `Role` | `role_id` | No | `@NotNull` | None | `@ManyToOne(fetch = FetchType.EAGER)`. |
| `status` | `UserStatus`| `status` | No | `@NotNull` | `PENDING_VERIFICATION` | Persisted as `@Enumerated(EnumType.STRING)`. |
| `emailVerified`| `Boolean` | `email_verified`| No | None | `false` | Primitive boolean flag. |
| `failedLoginAttempts`| `Integer` | `failed_login_attempts`| No | `@Min(0)` | `0` | Increments on auth failure. |
| `lockoutEnd` | `LocalDateTime`| `lockout_end` | Yes | None | `NULL` | Lock expiration timestamp. |
| `createdAt` | `LocalDateTime`| `created_at` | No | None | `LocalDateTime.now()`| Annotated with `@Column(updatable=false)`. |
| `updatedAt` | `LocalDateTime`| `updated_at` | Yes | None | `NULL` | Updated on modification. |

### 2. Spring Security `UserDetails` Integration
* **`getAuthorities()`**:
  * Extracts the associated `Role` name.
  * Prepends `"ROLE_"` to the name (e.g. `"CUSTOMER"` becomes `"ROLE_CUSTOMER"`).
  * Returns `List.of(new SimpleGrantedAuthority(roleName))`.
* **`getPassword()`**: Returns `passwordHash`.
* **`getUsername()`**: Returns `email`.
* **`isEnabled()`**: Returns `status == UserStatus.ACTIVE`.
* **Account Lock Behavior (`isAccountNonLocked()`)**:
  * Returns `true` if `status != UserStatus.LOCKED`.
  * If the status is `LOCKED` but the current time is after `lockoutEnd`, the locking state is considered expired. The system should automatically reset `failedLoginAttempts = 0`, clear `lockoutEnd`, restore status to `ACTIVE`, and return `true`.

---

## SECTION 4 — USER OTP ENTITY DESIGN

This entity handles short-lived verification codes.

### 1. Field Specification Table

| Field Name | Java Type | Database Column | Nullable | Validation Constraints | Default Value | Security Notes |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `Long` | `id` | No | None | IDENTITY | Primary Key. |
| `user` | `User` | `user_id` | No | `@NotNull` | None | `@ManyToOne(fetch = FetchType.LAZY)`. |
| `otpHash` | `String` | `otp_hash` | No | `@NotBlank`, `@Size(max=64)`| None | SHA-256 hash of plaintext OTP. |
| `purpose` | `OtpPurpose`| `purpose` | No | `@NotNull` | `VERIFICATION` | Persisted as `EnumType.STRING`. |
| `attempts` | `Integer` | `attempts` | No | `@Min(0)` | `0` | tracks failed verify attempts. |
| `expiresAt` | `LocalDateTime`| `expires_at` | No | `@NotNull` | None | OTP expiration timestamp. |
| `createdAt` | `LocalDateTime`| `created_at` | No | None | `LocalDateTime.now()`| Persisted on creation. |

### 2. Relationship and Cascade Behavior
* **Relationship**: Many-to-One from `UserOtp` to `User`. The user side does not maintain a collection of OTPs (unidirectional relationship) to prevent performance overhead.
* **Cascade**: Cascades are defined on the database level (`ON DELETE CASCADE` on `user_id` foreign key). JPA mappings do not use cascading saves, as OTPs are handled independently by `OtpService`.
* **Index**: Composite index `idx_otps_lookup` on `(user_id, purpose, expires_at)` to optimize cleanup and validation queries.

### 3. Lifecycle & Security Logic
* **OTP Hash Storage**: OTP codes are generated as random 6-digit numeric strings. Before saving, they are hashed using SHA-256 to prevent plain exposure in database logs.
* **Retry Counter**: Each failed verification attempt increments `attempts`. Once `attempts >= 3`, `OtpService` invalidates the database record.
* **Expiration Handling**: Queries check if `expiresAt` is before `LocalDateTime.now()`. Expired OTPs are rejected and cleaned up.

---

## SECTION 5 — REFRESH TOKEN ENTITY DESIGN

Stores hashed refresh tokens to manage user sessions.

### 1. Field Specification Table

| Field Name | Java Type | Database Column | Nullable | Validation Constraints | Default Value | Security Notes |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `Long` | `id` | No | None | IDENTITY | Primary Key. |
| `user` | `User` | `user_id` | No | `@NotNull` | None | `@ManyToOne(fetch = FetchType.LAZY)`. |
| `tokenHash` | `String` | `token_hash` | No | `@NotBlank`, `@Size(max=64)`| None | Unique SHA-256 hash of refresh token. |
| `expiresAt` | `LocalDateTime`| `expires_at` | No | `@NotNull` | None | Token expiration timestamp. |
| `revoked` | `Boolean` | `revoked` | No | None | `false` | Revocation status. |
| `createdAt` | `LocalDateTime`| `created_at` | No | None | `LocalDateTime.now()`| Persisted on creation. |

### 2. Hashing Strategy
To prevent session hijacking in the event of database access compromise, only the SHA-256 hash of the Refresh Token is stored:
$$\text{token\_hash} = \text{SHA-256}(\text{raw\_token})$$
The raw Refresh Token is transmitted only in the HttpOnly cookie response.

### 3. Refresh Token Rotation (RTR) & Theft Protection
* **Rotation**: When a client requests a new Access Token, the submitted Refresh Token is verified and then deleted or marked as `revoked = true`. A new token pair is generated, and the hash of the new Refresh Token is saved.
* **Theft Detection**: If a client submits a token whose hash exists in the database but has `revoked = true`, the system assumes a replay attack. The database deletes or revokes all active tokens for that `user_id`, terminating all active sessions.

---

## SECTION 6 — REPOSITORY DESIGN

This section designs the repository interfaces extending `JpaRepository`.

### 1. `UserRepository`

* **Existing Reusable Methods**:
  * `Optional<User> findByEmail(String email)`
  * `boolean existsByEmail(String email)`
* **New Required Methods**:
  * `Optional<User> findByEmailAndStatus(String email, UserStatus status)`: Used to retrieve active users during login.
  * **Custom JPQL / Native Update**:
    ```java
    // Increments failed login attempts
    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = u.failedLoginAttempts + 1 WHERE u.email = :email")
    void incrementFailedAttempts(String email);

    // Resets failed attempts and unlocks account
    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = 0, u.lockoutEnd = null, u.status = 'ACTIVE' WHERE u.id = :userId")
    void unlockUser(Integer userId);
    ```

### 2. `UserOtpRepository`

* **Required Query Methods**:
  * `Optional<UserOtp> findByUserAndPurpose(User user, OtpPurpose purpose)`: Resolves active OTPs for verification.
  * `void deleteByUserAndPurpose(User user, OtpPurpose purpose)`: Cleans up existing OTPs during regeneration.
  * **Asynchronous Cleanup JPQL**:
    ```java
    @Modifying
    @Query("DELETE FROM UserOtp o WHERE o.expiresAt < :now")
    void deleteExpiredOtps(LocalDateTime now);
    ```

### 3. `RefreshTokenRepository`

* **Required Query Methods**:
  * `Optional<RefreshToken> findByTokenHash(String tokenHash)`: Validates active refresh tokens.
  * `void deleteByTokenHash(String tokenHash)`: Removes sessions on logout.
  * **Revocation JPQL**:
    ```java
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId")
    void revokeAllUserTokens(Integer userId);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now OR r.revoked = true")
    void purgeExpiredOrRevokedTokens(LocalDateTime now);
    ```

---

## SECTION 7 — PACKAGE STRUCTURE REVIEW

Deploy the newly designed artifacts under the following package structure:

```
com.greenlife.entity
├── User.java                (Updated UserDetails entity mapping users table)
├── Role.java                (Existing Role entity mapping roles table)
├── UserOtp.java             (New entity mapping user_otps table)
├── RefreshToken.java        (New entity mapping refresh_tokens table)
└── enums
    ├── UserStatus.java      (New enum: PENDING_VERIFICATION, ACTIVE, LOCKED, DISABLED)
    └── OtpPurpose.java      (New enum: VERIFICATION)

com.greenlife.repository
├── UserRepository.java      (Updated JPA interface with custom update queries)
├── RoleRepository.java      (Existing JPA interface)
├── UserOtpRepository.java   (New JPA interface for user verification OTPs)
└── RefreshTokenRepository.java (New JPA interface for RTR session tokens)
```

---

## SECTION 8 — IMPLEMENTATION CHECKLIST

This checklist guides developers through the implementation of Sprint 2:

### Step 1: Create Enums
* **Prerequisites**: Package structure reviewed.
* **Outputs**: `UserStatus.java` and `OtpPurpose.java` inside `com.greenlife.entity.enums`.
* **Verification Criteria**: Compilation success.

### Step 2: Modify `User` Entity
* **Prerequisites**: Step 1 complete. Database migrations executed.
* **Outputs**: Updated `User.java` incorporating lockout fields, Enum mapping for status, and updated `isAccountNonLocked()` logic.
* **Verification Criteria**: Run tests checking UserDetails configuration.

### Step 3: Create `UserOtp` Entity
* **Prerequisites**: Step 2 complete.
* **Outputs**: `UserOtp.java` mapped to `user_otps` table.
* **Verification Criteria**: Hibernate schema validation succeeds.

### Step 4: Create `RefreshToken` Entity
* **Prerequisites**: Step 2 complete.
* **Outputs**: `RefreshToken.java` mapped to `refresh_tokens` table.
* **Verification Criteria**: Hibernate schema validation succeeds.

### Step 5: Implement Repositories
* **Prerequisites**: Steps 2, 3, and 4 complete.
* **Outputs**: `UserOtpRepository.java`, `RefreshTokenRepository.java`, and updated `UserRepository.java` with JPQL statements.
* **Verification Criteria**: Application boots without JPA query compilation errors.

### Step 6: Startup Verification
* **Prerequisites**: Step 5 complete.
* **Outputs**: Active logging during Spring context boot.
* **Verification Criteria**: Set `spring.jpa.hibernate.ddl-auto=validate`. Verify that the application boots successfully without database schema mismatch exceptions.

---

## SECTION 9 — DEFINITION OF DONE

Sprint 2 is considered complete when the following criteria are met:

1. **JPA Validation**: All entity annotations (`@Entity`, `@Table`, `@Column`, `@JoinColumn`) are validated by Hibernate against the active database schema.
2. **Repository Validation**: All custom repository methods and JPQL queries compile successfully.
3. **Startup Validation**: The Spring Boot application starts without database mapping errors (`SchemaManagementException`).
4. **Relationship Validation**: Cascading deletes are verified. Deleting a test `User` record must clean up all associated `UserOtp` and `RefreshToken` rows.
5. **Database Compatibility**: Verify that existing seeded active user records can be retrieved as `UserStatus.ACTIVE` entities.
