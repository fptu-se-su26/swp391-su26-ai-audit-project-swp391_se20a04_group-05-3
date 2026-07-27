# GreenLife Frontend — Route Security Audit

**Audit Date**: 2026-06-22
**Auditor**: Phase 11 QA Engineer
**Application Type**: Single Page Application (state-based routing via `currentPage` string)
**Guard Component**: `src/components/common/ProtectedRoute.tsx`

---

## Access Policy

Per the confirmed access policy for Phase 11:

| Route | Guest | Customer | Store | Admin | Notes |
|---|---|---|---|---|---|
| `home` | ✅ | ✅ | ✅ | ✅ | Public |
| `shop` | ✅ | ✅ | ✅ | ✅ | Public |
| `product-detail` | ✅ | ✅ | ✅ | ✅ | Public |
| `blog` | ✅ | ✅ | ✅ | ✅ | Public |
| `auth` | ✅ | ✅ | ✅ | ✅ | Public — redirects if already logged in |
| `ai-diagnosis` | ✅ | ✅ | ✅ | ✅ | **Intentionally public** — per policy |
| `booking` | ✅ | ✅ | ✅ | ✅ | **Browse only public** — create booking requires login |
| `customer-dashboard` | ❌→auth | ✅ | ✅ | ✅ | Protected |
| `store-dashboard` | ❌→auth | ❌→home | ✅ | ✅ | Protected |
| `store-profile-setup` | ❌→auth | ❌→home | ✅ | ✅ | Protected |
| `admin-dashboard` | ❌→auth | ❌→home | ❌→home | ✅ | Protected |

---

## Route Guard Implementation Analysis

### `ProtectedRoute` Component
**File**: `src/components/common/ProtectedRoute.tsx`

```
ProtectedRoute
├── reads user/role/isAuthenticating from useAuth hook
├── while isAuthenticating → renders DashboardSkeleton (no flash of protected content)
├── if !user → calls onPageRedirect("auth")
├── if user but !isAllowed → calls onPageRedirect("home")
└── if allowed → renders children
```

**Status**: ✅ Implementation is correct and complete.

---

## Route-by-Route Security Assessment

### Public Routes

| Route | Guarded? | Correct? | Notes |
|---|---|---|---|
| `home` | No | ✅ | Intentionally public landing page |
| `shop` | No | ✅ | Product browsing requires no authentication |
| `product-detail` | No | ✅ | Detail view requires no auth |
| `blog` | No | ✅ | Content marketing, intentionally open |
| `auth` | No | ✅ | Login/Register page |
| `ai-diagnosis` | No | ✅ | Policy: all roles including guests may use AI diagnosis |
| `booking` | No | ✅ | Policy: browse-only is public; booking action checks auth at feature level |

### Protected Routes

| Route | `allowedRoles` | Guest Redirect | Wrong Role Redirect | Status |
|---|---|---|---|---|
| `customer-dashboard` | `["customer","store","admin"]` | → `auth` | → `home` | ✅ |
| `store-dashboard` | `["store","admin"]` | → `auth` | → `home` | ✅ |
| `store-profile-setup` | `["store","admin"]` | → `auth` | → `home` | ✅ |
| `admin-dashboard` | `["admin"]` | → `auth` | → `home` | ✅ |

---

## Booking Feature — Sub-Action Access Control

The `booking` route (Expert Directory) renders `ExpertDirectoryView` which is public. However, the **create booking** action within the view checks authentication at the feature level before calling the API.

**Audit result**: The `BookingService.createBooking()` call goes through `HttpClient`, which automatically attaches JWT tokens. If a guest somehow triggers it, the backend will return a `401`, which `HttpClient` handles by calling `AuthService.logout()` and throwing `UnauthorizedError`. The frontend should catch this and redirect to auth.

**Recommendation**: Add an explicit authentication check in the booking form submission handler to redirect unauthenticated users before the API call, rather than relying solely on backend 401.

---

## Identified Vulnerabilities & Missing Guards

### LOW: No Frontend-Level Auth Check on Booking Action
- **Location**: `ExpertDirectoryView.tsx` — booking submission
- **Risk**: Guest can attempt to submit a booking form; error handling catches the 401, but user experience is degraded (form submission fails, not pre-empted)
- **Recommended Fix**: Add `if (!currentUser) { setCurrentPage("auth"); return; }` at the start of the booking submit handler

### INFO: `store-profile-setup` accessible to `admin` role
- **Status**: Intentional — admins may need to set up demo stores
- **Recommendation**: No change required

### INFO: `customer-dashboard` accessible to `store` and `admin` roles
- **Status**: Intentional — store owners and admins are also customers
- **Recommendation**: No change required

---

## Authentication State Management

| Mechanism | Implementation | Status |
|---|---|---|
| JWT Access Token storage | `AuthService` via `storage.ts` wrapper | ✅ |
| Token auto-injection | `HttpClient.request()` reads token per-request | ✅ |
| Token refresh interval | `AppContext.tsx` — 10 min background refresh | ✅ |
| 401 auto-logout | `HttpClient.request()` calls `AuthService.logout()` on 401 | ✅ |
| Auth state initialization | `AppContext.initializeApp()` calls `AuthService.getCurrentUser()` | ✅ |
| Loading guard during init | `ProtectedRoute` shows skeleton while `loading.auth === true` | ✅ |

---

## Summary

| Category | Count |
|---|---|
| Fully secured routes | 4 |
| Intentionally public routes | 7 |
| Vulnerabilities (HIGH) | 0 |
| Vulnerabilities (MEDIUM) | 0 |
| Vulnerabilities (LOW) | 1 |
| Info items | 2 |

**Overall Security Verdict**: ✅ **SECURE** — all routes correctly enforce RBAC. One low-severity UX improvement identified for booking pre-auth check.
