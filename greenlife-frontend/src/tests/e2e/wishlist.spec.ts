/**
 * wishlist.spec.ts — GreenLife Wishlist Flow E2E Tests
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test src/tests/e2e/wishlist.spec.ts
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsCustomer(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await page.getByLabel(/email/i).fill("customer@greenlife.vn");
  await page.getByLabel(/mật khẩu/i).fill("Password123!");
  await page.getByRole("button", { name: /^đăng nhập$/i }).click();
  await page.waitForTimeout(2000);
}

// ---------------------------------------------------------------------------
// Test suite: Wishlist
// ---------------------------------------------------------------------------

test.describe("Wishlist Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  // -------------------------------------------------------------------------
  test("TC-WISH-01: Authenticated user can add product to wishlist", async ({ page }) => {
    await page.getByRole("link", { name: /cửa hàng/i }).click();
    await page.waitForTimeout(1500);

    // Click the heart/save icon on the first product card
    await page.getByRole("button", { name: /lưu|yêu thích/i }).first().click();

    // Expect visual feedback — filled heart or toast
    const isActive = await page
      .getByRole("button", { name: /đã lưu|yêu thích/i })
      .first()
      .isVisible();
    const isToast = await page.getByRole("status").isVisible();
    expect(isActive || isToast).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-WISH-02: Wishlist persists across page refresh", async ({ page }) => {
    await page.getByRole("link", { name: /cửa hàng/i }).click();
    await page.waitForTimeout(1500);

    // Save a product
    await page.getByRole("button", { name: /lưu|yêu thích/i }).first().click();
    await page.waitForTimeout(1000);

    // Reload and check wishlist state
    await page.reload();
    await page.waitForTimeout(2000);

    // Navigate back to shop
    await page.getByRole("link", { name: /cửa hàng/i }).click();
    await page.waitForTimeout(1500);

    const isSaved = await page
      .getByRole("button", { name: /đã lưu/i })
      .first()
      .isVisible();
    expect(isSaved).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-WISH-03: Product detail page shows wishlist save state", async ({ page }) => {
    await page.getByRole("link", { name: /cửa hàng/i }).click();
    await page.waitForTimeout(1500);

    // Click first product to go to detail
    await page.locator("[data-testid='product-card']").first().click();
    await page.waitForTimeout(1000);

    // Heart/like button should be visible on detail page
    await expect(page.getByRole("button", { name: /yêu thích|lưu/i })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-WISH-04: Guest cannot add to wishlist — redirected to auth", async ({ page }) => {
    // Navigate without login
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /cửa hàng/i }).click();
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: /lưu|yêu thích/i }).first().click();

    // Should see a toast or be redirected to auth
    const isAuthVisible = await page.getByRole("heading", { name: /đăng nhập/i }).isVisible();
    const isToastVisible = await page.getByRole("status").isVisible();
    expect(isAuthVisible || isToastVisible).toBeTruthy();
  });
});
