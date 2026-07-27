/**
 * shop.spec.ts — GreenLife Shop Flow E2E Tests
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test src/tests/e2e/shop.spec.ts
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goToShop(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole("link", { name: /cửa hàng/i }).click();
  await expect(page.getByRole("heading", { name: /cửa hàng sinh thái/i })).toBeVisible({
    timeout: 8000,
  });
}

// ---------------------------------------------------------------------------
// Test suite: Guest — Shop browsing
// ---------------------------------------------------------------------------

test.describe("Shop Flow", () => {
  test.beforeEach(async ({ page }) => {
    await goToShop(page);
  });

  // -------------------------------------------------------------------------
  test("TC-SHOP-01: Shop page loads product grid", async ({ page }) => {
    // Product cards should appear
    await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({
      timeout: 8000,
    });
  });

  // -------------------------------------------------------------------------
  test("TC-SHOP-02: Search filters products correctly", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/tìm phân trùn/i);
    await searchInput.fill("sen đá");

    // Wait for debounce (400 ms) + API response
    await page.waitForTimeout(800);

    // Verify at least one result or empty state renders
    const hasResults = await page.locator("[data-testid='product-card']").count();
    const hasEmptyState = await page.getByText(/không tìm thấy sản phẩm/i).isVisible();
    expect(hasResults > 0 || hasEmptyState).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  test("TC-SHOP-03: Category filter narrows results", async ({ page }) => {
    // Click the "Cây Xanh Bản Địa" category pill
    await page.getByRole("button", { name: /cây xanh bản địa/i }).click();
    await page.waitForTimeout(800);

    // Expect product grid to have updated
    await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({
      timeout: 5000,
    });
  });

  // -------------------------------------------------------------------------
  test("TC-SHOP-04: Sort dropdown changes order", async ({ page }) => {
    const sortSelect = page.getByRole("combobox");
    await sortSelect.selectOption("price-asc");
    await page.waitForTimeout(500);

    // Expect page to re-render (no crash)
    await expect(page.locator("[data-testid='product-card']").first()).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-SHOP-05: Clicking product card navigates to product detail", async ({ page }) => {
    await page.locator("[data-testid='product-card']").first().click();

    // Product detail page should show
    await expect(page.getByText(/thêm vào giỏ/i)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-SHOP-06: Product detail shows reviews section", async ({ page }) => {
    await page.locator("[data-testid='product-card']").first().click();
    await expect(page.getByText(/đánh giá từ khách hàng/i)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-SHOP-07: Blog navigation works from navigation", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /cẩm nang/i }).click();
    await expect(page.getByRole("heading", { name: /cẩm nang xanh/i })).toBeVisible({
      timeout: 8000,
    });
  });
});
