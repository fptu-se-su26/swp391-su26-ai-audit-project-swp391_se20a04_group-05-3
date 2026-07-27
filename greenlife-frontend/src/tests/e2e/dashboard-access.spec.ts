/**
 * dashboard-access.spec.ts — GreenLife Dashboard Role-Based Access Control E2E Tests
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test src/tests/e2e/dashboard-access.spec.ts
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAs(page: Page, role: "customer" | "store" | "admin") {
  const credentials: Record<string, { email: string; password: string }> = {
    customer: { email: "customer@greenlife.vn", password: "Password123!" },
    store: { email: "store@greenlife.vn", password: "Password123!" },
    admin: { email: "admin@greenlife.vn", password: "AdminPass123!" },
  };

  await page.goto(BASE_URL);
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await page.getByLabel(/email/i).fill(credentials[role].email);
  await page.getByLabel(/mật khẩu/i).fill(credentials[role].password);
  await page.getByRole("button", { name: /^đăng nhập$/i }).click();
  await page.waitForTimeout(2500);
}

async function navigateToPage(page: Page, pageId: string) {
  // Trigger navigation by clicking nav links or directly via internal state
  // In this SPA, navigation is state-driven — use the nav buttons
  await page.evaluate((p) => {
    window.dispatchEvent(new CustomEvent("gl-navigate", { detail: { page: p } }));
  }, pageId);
  await page.waitForTimeout(1000);
}

// ---------------------------------------------------------------------------
// Test suite: Dashboard Access Control
// ---------------------------------------------------------------------------

test.describe("Dashboard Access Control (RBAC)", () => {
  // -------------------------------------------------------------------------
  test("TC-RBAC-01: Guest is redirected to auth when accessing customer-dashboard", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    // Navigate as guest to customer-dashboard by clicking profile icon
    await page.getByRole("button", { name: /tài khoản|hồ sơ/i }).click().catch(() => {});
    await page.waitForTimeout(1000);

    // Should see auth page, not dashboard content
    const isAuthPage = await page.getByRole("heading", { name: /đăng nhập/i }).isVisible();
    const isDashboard = await page.getByText(/đơn mua của tôi/i).isVisible();
    expect(isAuthPage && !isDashboard).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-02: Customer cannot access admin-dashboard", async ({ page }) => {
    await loginAs(page, "customer");
    // Attempt to navigate to admin dashboard
    await navigateToPage(page, "admin-dashboard");

    const isAdminPage = await page.getByText(/quản trị viên|user management/i).isVisible();
    expect(!isAdminPage).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-03: Customer cannot access store-dashboard", async ({ page }) => {
    await loginAs(page, "customer");
    await navigateToPage(page, "store-dashboard");

    // Should be redirected home or to profile setup — NOT the store dashboard
    const isStoreDashboard = await page.getByText(/quản lý đơn hàng cửa hàng/i).isVisible();
    expect(!isStoreDashboard).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-04: Customer can access customer-dashboard", async ({ page }) => {
    await loginAs(page, "customer");
    await expect(page.getByText(/đơn mua của tôi/i)).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-05: Store owner can access store-dashboard", async ({ page }) => {
    await loginAs(page, "store");
    // Store owners are auto-routed to store dashboard
    await expect(page.getByText(/doanh thu|quản lý sản phẩm/i)).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-06: Store owner cannot access admin-dashboard", async ({ page }) => {
    await loginAs(page, "store");
    await navigateToPage(page, "admin-dashboard");

    const isAdminPage = await page.getByText(/phê duyệt nhà vườn/i).isVisible();
    expect(!isAdminPage).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-07: Admin can access admin-dashboard", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.getByText(/phê duyệt nhà vườn|quản trị/i)).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-08: AI Diagnosis is accessible to guests", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /ai|chẩn đoán/i }).click();
    // Should load diagnosis page without auth challenge
    await expect(page.getByRole("heading", { name: /chẩn đoán/i })).toBeVisible({ timeout: 6000 });
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-09: Expert Directory is accessible to guests", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /chuyên gia|đặt lịch/i }).click();
    await expect(page.getByRole("heading", { name: /chuyên gia/i })).toBeVisible({ timeout: 6000 });
  });

  // -------------------------------------------------------------------------
  test("TC-RBAC-10: store-profile-setup requires store or admin role", async ({ page }) => {
    await loginAs(page, "customer");
    await navigateToPage(page, "store-profile-setup");

    // Customer should not land on seller setup page
    const isSetupPage = await page.getByText(/đăng ký bán hàng|hồ sơ nhà vườn/i).isVisible();
    // ProtectedRoute redirects customers — they should see home or customer-dashboard
    const isRedirected = await page.getByText(/cửa hàng sinh thái|đơn mua/i).isVisible();
    expect(!isSetupPage || isRedirected).toBeTruthy();
  });
});
