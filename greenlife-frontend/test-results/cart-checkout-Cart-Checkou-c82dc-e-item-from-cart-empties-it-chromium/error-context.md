# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout.spec.ts >> Cart & Checkout Flow >> TC-CART-04: Remove item from cart empties it
- Location: src\tests\e2e\cart-checkout.spec.ts:70:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /đăng nhập/i })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - img [ref=e8]
  - generic [ref=e10]:
    - heading "Đã xảy ra lỗi không mong muốn." [level=2] [ref=e11]
    - paragraph [ref=e12]: Hệ thống gặp sự cố tải tài nguyên hoặc lỗi giao diện. Vui lòng tải lại trang hoặc liên hệ bộ phận hỗ trợ.
  - button "Tải lại trang" [ref=e13] [cursor=pointer]
```

# Test source

```ts
  1   | /**
  2   |  * cart-checkout.spec.ts — GreenLife Cart & Checkout Flow E2E Tests
  3   |  *
  4   |  * Prerequisites:
  5   |  *   npm install -D @playwright/test
  6   |  *   npx playwright install
  7   |  *
  8   |  * Run:
  9   |  *   npx playwright test src/tests/e2e/cart-checkout.spec.ts
  10  |  */
  11  | 
  12  | import { test, expect, Page } from "@playwright/test";
  13  | 
  14  | const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  15  | 
  16  | // ---------------------------------------------------------------------------
  17  | // Helpers
  18  | // ---------------------------------------------------------------------------
  19  | 
  20  | async function loginAsCustomer(page: Page) {
  21  |   await page.goto(BASE_URL);
> 22  |   await page.getByRole("button", { name: /đăng nhập/i }).click();
      |                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
  23  |   await page.getByLabel(/email/i).fill("customer@greenlife.vn");
  24  |   await page.getByLabel(/mật khẩu/i).fill("Password123!");
  25  |   await page.getByRole("button", { name: /^đăng nhập$/i }).click();
  26  |   await page.waitForTimeout(2000);
  27  | }
  28  | 
  29  | async function addFirstProductToCart(page: Page) {
  30  |   await page.goto(BASE_URL);
  31  |   await page.getByRole("link", { name: /cửa hàng/i }).click();
  32  |   await page.waitForTimeout(1500);
  33  |   // Click the first "Thêm vào giỏ" button
  34  |   await page.getByRole("button", { name: /thêm vào giỏ/i }).first().click();
  35  | }
  36  | 
  37  | // ---------------------------------------------------------------------------
  38  | // Test suite: Cart & Checkout
  39  | // ---------------------------------------------------------------------------
  40  | 
  41  | test.describe("Cart & Checkout Flow", () => {
  42  |   test.beforeEach(async ({ page }) => {
  43  |     await loginAsCustomer(page);
  44  |   });
  45  | 
  46  |   // -------------------------------------------------------------------------
  47  |   test("TC-CART-01: Adding a product opens cart drawer", async ({ page }) => {
  48  |     await addFirstProductToCart(page);
  49  |     // Cart drawer should slide in
  50  |     await expect(page.getByRole("heading", { name: /giỏ hàng/i })).toBeVisible({ timeout: 5000 });
  51  |   });
  52  | 
  53  |   // -------------------------------------------------------------------------
  54  |   test("TC-CART-02: Cart shows correct item count in navigation badge", async ({ page }) => {
  55  |     await addFirstProductToCart(page);
  56  |     // Badge on cart icon should show > 0
  57  |     const badge = page.locator("[data-testid='cart-count']");
  58  |     await expect(badge).toContainText(/[1-9]/);
  59  |   });
  60  | 
  61  |   // -------------------------------------------------------------------------
  62  |   test("TC-CART-03: Quantity increase button works", async ({ page }) => {
  63  |     await addFirstProductToCart(page);
  64  |     await page.getByRole("button", { name: /tăng số lượng/i }).first().click();
  65  |     // Quantity in cart should be 2
  66  |     await expect(page.getByText("2")).toBeVisible();
  67  |   });
  68  | 
  69  |   // -------------------------------------------------------------------------
  70  |   test("TC-CART-04: Remove item from cart empties it", async ({ page }) => {
  71  |     await addFirstProductToCart(page);
  72  |     await page.getByRole("button", { name: /xóa sản phẩm/i }).first().click();
  73  |     // Empty state should appear
  74  |     await expect(page.getByText(/giỏ hàng trống/i)).toBeVisible({ timeout: 5000 });
  75  |   });
  76  | 
  77  |   // -------------------------------------------------------------------------
  78  |   test("TC-CART-05: Cart drawer closes on Escape key", async ({ page }) => {
  79  |     await addFirstProductToCart(page);
  80  |     await expect(page.getByRole("heading", { name: /giỏ hàng/i })).toBeVisible();
  81  |     await page.keyboard.press("Escape");
  82  |     await expect(page.getByRole("heading", { name: /giỏ hàng/i })).toBeHidden({ timeout: 3000 });
  83  |   });
  84  | 
  85  |   // -------------------------------------------------------------------------
  86  |   test("TC-CART-06: Checkout step 2 requires address selection", async ({ page }) => {
  87  |     await addFirstProductToCart(page);
  88  |     // Proceed to checkout step
  89  |     await page.getByRole("button", { name: /tiến hành thanh toán/i }).click();
  90  |     // Address selection UI should appear
  91  |     await expect(page.getByText(/địa chỉ giao hàng/i)).toBeVisible({ timeout: 5000 });
  92  |   });
  93  | 
  94  |   // -------------------------------------------------------------------------
  95  |   test("TC-CART-07: COD payment method selection works", async ({ page }) => {
  96  |     await addFirstProductToCart(page);
  97  |     await page.getByRole("button", { name: /tiến hành thanh toán/i }).click();
  98  |     await page.waitForTimeout(1000);
  99  | 
  100 |     // Select COD payment
  101 |     const codOption = page.getByText(/thanh toán khi nhận hàng/i);
  102 |     if (await codOption.isVisible()) {
  103 |       await codOption.click();
  104 |       await expect(codOption).toBeChecked();
  105 |     }
  106 |   });
  107 | 
  108 |   // -------------------------------------------------------------------------
  109 |   test("TC-CART-08: Guest adding to cart redirects to auth", async ({ page }) => {
  110 |     // Start fresh without login
  111 |     await page.goto(BASE_URL);
  112 |     await page.getByRole("link", { name: /cửa hàng/i }).click();
  113 |     await page.waitForTimeout(1500);
  114 |     await page.getByRole("button", { name: /thêm vào giỏ/i }).first().click();
  115 | 
  116 |     // Should show auth page or toast message
  117 |     const isAuthPage = await page.getByRole("heading", { name: /đăng nhập/i }).isVisible();
  118 |     const isToast = await page.getByRole("status").isVisible();
  119 |     expect(isAuthPage || isToast).toBeTruthy();
  120 |   });
  121 | });
  122 | 
```