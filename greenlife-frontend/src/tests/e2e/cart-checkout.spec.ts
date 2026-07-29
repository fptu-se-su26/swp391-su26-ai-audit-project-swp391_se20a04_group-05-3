import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

async function loginAsCustomer(page: Page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem("token", "fake-jwt-token");
    localStorage.setItem("user", JSON.stringify({
      id: 1,
      name: "Customer User",
      email: "customer@greenlife.test",
      role: "customer"
    }));
  });
  await page.reload();
}

async function addFirstProductToCart(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole("link", { name: /cửa hàng/i }).click();
  await page.waitForTimeout(1500);
  const addButton = page.getByRole("button", { name: /thêm vào giỏ/i }).first();
  if (await addButton.isVisible()) {
    await addButton.click();
  }
}

test.describe("Cart & Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  // -------------------------------------------------------------------------
  test("TC-CART-01: Adding a product opens cart drawer", async ({ page }) => {
    await addFirstProductToCart(page);
    await expect(page.getByRole("heading", { name: /giỏ hàng/i })).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-CART-02: Cart shows correct item count in navigation badge", async ({ page }) => {
    await addFirstProductToCart(page);
    const badge = page.locator("[data-testid='cart-count']");
    await expect(badge).toContainText(/[1-9]/);
  });

  // -------------------------------------------------------------------------
  test("TC-CART-03: Quantity increase button works", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("button", { name: /tăng số lượng/i }).first().click();
    await expect(page.getByText("2")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-CART-04: Remove item from cart empties it", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("button", { name: /xóa/i }).first().click();
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
  test("TC-CART-06: Checkbox selection renders for each item and Select All toggles selection", async ({ page }) => {
    await addFirstProductToCart(page);
    const selectAllCheckbox = page.getByRole("checkbox", { name: /chọn tất cả/i });
    await expect(selectAllCheckbox).toBeVisible();
    await expect(selectAllCheckbox).toBeChecked();

    // Toggle Select All off
    await selectAllCheckbox.click();
    await expect(selectAllCheckbox).not.toBeChecked();

    // Checkout button should be disabled when nothing selected
    const checkoutBtn = page.getByRole("button", { name: /chọn địa chỉ giao hàng|tiến hành thanh toán/i });
    await expect(checkoutBtn).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  test("TC-CART-07: Checkout step 2 requires address selection", async ({ page }) => {
    await addFirstProductToCart(page);
    const checkoutBtn = page.getByRole("button", { name: /chọn địa chỉ giao hàng|tiến hành thanh toán/i });
    await checkoutBtn.click();
    await expect(page.getByText(/địa chỉ giao hàng/i)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-CART-08: COD payment method selection works", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("button", { name: /chọn địa chỉ giao hàng|tiến hành thanh toán/i }).click();
    await page.waitForTimeout(1000);

    const codOption = page.getByText(/thanh toán khi nhận hàng/i);
    if (await codOption.isVisible()) {
      await codOption.click();
      await expect(codOption).toBeChecked();
    }
  });

  // -------------------------------------------------------------------------
  test("TC-CART-09: Guest adding to cart redirects to auth", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /cửa hàng/i }).click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /thêm vào giỏ/i }).first().click();

    const isAuthPage = await page.getByRole("heading", { name: /đăng nhập/i }).isVisible();
    const isToast = await page.getByRole("status").isVisible();
    expect(isAuthPage || isToast).toBeTruthy();
  });
});
