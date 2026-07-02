/**
 * admin-workflow.spec.ts — GreenLife Admin Workflow E2E Tests
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test src/tests/e2e/admin-workflow.spec.ts
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await page.getByLabel(/email/i).fill("admin@greenlife.vn");
  await page.getByLabel(/mật khẩu/i).fill("AdminPass123!");
  await page.getByRole("button", { name: /^đăng nhập$/i }).click();
  await page.waitForTimeout(2500);
}

async function navigateToAdminTab(page: Page, tabName: string) {
  await page.getByRole("link", { name: new RegExp(tabName, "i") }).click();
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Test suite: Admin Workflow
// ---------------------------------------------------------------------------

test.describe("Admin Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // Admin should be auto-routed to admin-dashboard
    await expect(page.getByText(/quản trị|tổng quan/i).first()).toBeVisible({ timeout: 8000 });
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-01: Admin dashboard shows statistics overview", async ({ page }) => {
    await expect(page.getByText(/tổng doanh thu|người dùng|đơn hàng/i).first()).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-02: Admin can navigate to User Management tab", async ({ page }) => {
    await navigateToAdminTab(page, "người dùng|thành viên");
    await expect(page.getByText(/quản lý thành viên|danh sách thành viên/i).first()).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-03: Admin can navigate to Store Approval tab", async ({ page }) => {
    await navigateToAdminTab(page, "nhà vườn|cửa hàng");
    await expect(
      page.getByText(/chờ duyệt|phê duyệt nhà vườn/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-04: Admin can see pending store approval requests", async ({ page }) => {
    await navigateToAdminTab(page, "nhà vườn|cửa hàng");

    // Either pending store cards or the empty state should render
    const hasPending = await page.getByText(/chờ duyệt/i).isVisible();
    const hasEmptyState = await page.getByText(/không có yêu cầu duyệt/i).isVisible();
    expect(hasPending || hasEmptyState).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-05: Admin can navigate to Products tab", async ({ page }) => {
    await navigateToAdminTab(page, "sản phẩm");
    await expect(page.getByText(/mặt hàng niêm yết|quản lý sản phẩm|sản phẩm sinh thái/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-06: Admin can navigate to Orders tab", async ({ page }) => {
    await navigateToAdminTab(page, "đơn hàng");
    await expect(page.getByText(/các giao dịch đơn hàng|mã giao dịch/i).first()).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-07: Admin can navigate to Blog Management tab", async ({ page }) => {
    await navigateToAdminTab(page, "bài viết|cẩm nang|blog");
    await expect(
      page.getByText(/quản lý bài viết|bắt đầu viết bài|chưa có bài viết/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-08: Admin user search filters work", async ({ page }) => {
    await navigateToAdminTab(page, "người dùng|thành viên");
    const searchInput = page.getByPlaceholder(/tìm người dùng|tìm email/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("test@example.com");
      await page.waitForTimeout(500);
      // Either results or empty state should render
      const hasResults = await page.locator("tr").count();
      expect(hasResults).toBeGreaterThanOrEqual(1);
    }
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-09: Approving a store changes its status", async ({ page }) => {
    await navigateToAdminTab(page, "nhà vườn|cửa hàng");
    const approveBtn = page.getByRole("button", { name: /phê duyệt hồ sơ|chấp thuận/i }).first();

    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      // Expect a toast or status change
      await expect(page.getByRole("status")).toBeVisible({ timeout: 5000 });
    } else {
      // No pending stores — skip
      test.skip();
    }
  });

  // -------------------------------------------------------------------------
  test("TC-ADMIN-10: Admin can see revenue chart on overview", async ({ page }) => {
    // Revenue chart (recharts AreaChart) should render on overview tab
    await expect(page.locator(".recharts-surface").first()).toBeVisible({ timeout: 5000 });
  });
});
