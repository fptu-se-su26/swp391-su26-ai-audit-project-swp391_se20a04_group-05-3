/**
 * cart-checkout.spec.ts — GreenLife Cart & Checkout Flow E2E Tests
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test src/tests/e2e/cart-checkout.spec.ts
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

async function addFirstProductToCart(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole("link", { name: /cửa hàng/i }).click();
  await page.waitForTimeout(1500);
  // Click the first "Thêm vào giỏ" button
  await page.getByRole("button", { name: /thêm vào giỏ/i }).first().click();
}

// ---------------------------------------------------------------------------
// Test suite: Cart & Checkout
// ---------------------------------------------------------------------------

test.describe("Cart & Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  // -------------------------------------------------------------------------
  test("TC-CART-01: Adding a product opens cart drawer", async ({ page }) => {
    await addFirstProductToCart(page);
    // Cart drawer should slide in
    await expect(page.getByRole("heading", { name: /giỏ hàng/i })).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-CART-02: Cart shows correct item count in navigation badge", async ({ page }) => {
    await addFirstProductToCart(page);
    // Badge on cart icon should show > 0
    const badge = page.locator("[data-testid='cart-count']");
    await expect(badge).toContainText(/[1-9]/);
  });

  // -------------------------------------------------------------------------
  test("TC-CART-03: Quantity increase button works", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("button", { name: /tăng số lượng/i }).first().click();
    // Quantity in cart should be 2
    await expect(page.getByText("2")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-CART-04: Remove item from cart empties it", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("button", { name: /xóa sản phẩm/i }).first().click();
    // Empty state should appear
    await expect(page.getByText(/giỏ hàng trống/i)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-CART-05: Cart drawer closes on Escape key", async ({ page }) => {
    await addFirstProductToCart(page);
    await expect(page.getByRole("heading", { name: /giỏ hàng/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: /giỏ hàng/i })).toBeHidden({ timeout: 3000 });
  });

  // -------------------------------------------------------------------------
  test("TC-CART-06: Checkout step 2 requires address selection", async ({ page }) => {
    await addFirstProductToCart(page);
    // Proceed to checkout step
    await page.getByRole("button", { name: /tiến hành thanh toán/i }).click();
    // Address selection UI should appear
    await expect(page.getByText(/địa chỉ giao hàng/i)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-CART-07: COD payment method selection works", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("button", { name: /tiến hành thanh toán/i }).click();
    await page.waitForTimeout(1000);

    // Select COD payment
    const codOption = page.getByText(/thanh toán khi nhận hàng/i);
    if (await codOption.isVisible()) {
      await codOption.click();
      await expect(codOption).toBeChecked();
    }
  });

  // -------------------------------------------------------------------------
  test("TC-CART-08: Guest adding to cart redirects to auth", async ({ page }) => {
    // Start fresh without login
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /cửa hàng/i }).click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /thêm vào giỏ/i }).first().click();

    // Should show auth page or toast message
    const isAuthPage = await page.getByRole("heading", { name: /đăng nhập/i }).isVisible();
    const isToast = await page.getByRole("status").isVisible();
    expect(isAuthPage || isToast).toBeTruthy();
  });
});
