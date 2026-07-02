/**
 * auth.spec.ts — GreenLife Authentication Flow E2E Tests
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test src/tests/e2e/auth.spec.ts
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navigateToAuth(page: Page) {
  await page.goto(BASE_URL);
  // Click the "Đăng nhập" button in the Navigation bar
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await expect(page.getByRole("heading", { name: /đăng nhập/i })).toBeVisible();
}

// ---------------------------------------------------------------------------
// Test suite: Guest — Authentication page
// ---------------------------------------------------------------------------

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAuth(page);
  });

  // -------------------------------------------------------------------------
  test("TC-AUTH-01: Auth page renders correctly for guests", async ({ page }) => {
    // Expect email and password fields to be visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mật khẩu/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^đăng nhập$/i })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-AUTH-02: Login with valid credentials navigates to dashboard", async ({ page }) => {
    await page.getByLabel(/email/i).fill("customer@greenlife.vn");
    await page.getByLabel(/mật khẩu/i).fill("Password123!");
    await page.getByRole("button", { name: /^đăng nhập$/i }).click();

    // Expect redirect to customer dashboard
    await expect(page.getByText(/đơn mua của tôi/i)).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  test("TC-AUTH-03: Login with invalid credentials shows error toast", async ({ page }) => {
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/mật khẩu/i).fill("wrongpassword");
    await page.getByRole("button", { name: /^đăng nhập$/i }).click();

    // Expect a toast error message
    await expect(page.getByRole("status")).toContainText(/sai/i, { timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-AUTH-04: Registration flow — send OTP and verify", async ({ page }) => {
    // Switch to register tab
    await page.getByRole("button", { name: /đăng ký/i }).click();

    await page.getByLabel(/họ và tên/i).fill("Nguyễn Văn Test");
    await page.getByLabel(/email/i).fill(`test_${Date.now()}@greenlife.vn`);
    await page.locator("#reg-password").fill("Test@12345");
    await page.locator("#reg-confirm-password").fill("Test@12345");

    // Send OTP
    await page.getByRole("button", { name: /gửi mã otp/i }).click();
    await expect(page.getByText(/mã otp đã được gửi/i)).toBeVisible({ timeout: 5000 });

    // (Actual OTP entry requires backend integration — skipped in skeleton)
  });

  // -------------------------------------------------------------------------
  test("TC-AUTH-05: Logout clears session and returns to home", async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill("customer@greenlife.vn");
    await page.getByLabel(/mật khẩu/i).fill("Password123!");
    await page.getByRole("button", { name: /^đăng nhập$/i }).click();
    await page.waitForTimeout(2000);

    // Logout
    await page.getByRole("button", { name: /đăng xuất/i }).click();

    // Expect home page content
    await expect(page.getByRole("heading", { name: /greenlife/i })).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-AUTH-06: Google OAuth button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });
});
