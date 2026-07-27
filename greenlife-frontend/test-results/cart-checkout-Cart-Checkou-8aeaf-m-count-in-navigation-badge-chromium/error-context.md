# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout.spec.ts >> Cart & Checkout Flow >> TC-CART-02: Cart shows correct item count in navigation badge
- Location: src\tests\e2e\cart-checkout.spec.ts:54:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /thêm vào giỏ/i }).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6] [cursor=pointer]:
        - img [ref=e8]
        - generic [ref=e11]:
          - generic [ref=e12]:
            - text: Green
            - generic [ref=e13]: Life
          - paragraph [ref=e14]: ECO-TECH LUXURY
      - generic [ref=e16]: GREEN LIFE
      - generic [ref=e17]:
        - generic [ref=e18]:
          - img [ref=e19]
          - generic [ref=e22]:
            - text: "Vườn:"
            - strong [ref=e23]: Thảo Mộc Đô Thị GreenLife Đà Nẵng
        - button "Đổi giao diện" [ref=e24] [cursor=pointer]:
          - img [ref=e25]
        - button "Giỏ hàng" [ref=e27] [cursor=pointer]:
          - img [ref=e28]
        - button "Thông báo" [ref=e32] [cursor=pointer]:
          - img [ref=e33]
        - 'button "Tài khoản: Nguyễn Thị Lan (customer)" [ref=e36] [cursor=pointer]':
          - img [ref=e37]
        - button "Đăng xuất" [ref=e40] [cursor=pointer]:
          - img [ref=e41]
    - navigation [ref=e45]:
      - link "Trang Chủ" [ref=e46] [cursor=pointer]:
        - generic [ref=e47]:
          - img [ref=e48]
          - text: Trang Chủ
      - link "Cửa Hàng" [active] [ref=e51] [cursor=pointer]:
        - generic [ref=e52]:
          - img [ref=e53]
          - text: Cửa Hàng
      - link "Bác Sĩ Cây AI" [ref=e57] [cursor=pointer]:
        - generic [ref=e58]:
          - img [ref=e59]
          - text: Bác Sĩ Cây AI
      - link "Danh Bạ Chuyên Gia" [ref=e71] [cursor=pointer]:
        - generic [ref=e72]:
          - img [ref=e73]
          - text: Danh Bạ Chuyên Gia
      - link "Cẩm Nang Xanh" [ref=e78] [cursor=pointer]:
        - generic [ref=e79]:
          - img [ref=e80]
          - text: Cẩm Nang Xanh
      - link "Hồ Sơ Của Tôi 👤" [ref=e83] [cursor=pointer]:
        - generic [ref=e84]:
          - img [ref=e85]
          - text: Hồ Sơ Của Tôi 👤
    - paragraph [ref=e93]:
      - text: "Cam kết môi trường:"
      - strong [ref=e94]: 100%
      - text: canh tác hữu cơ bền vững Việt Nam
  - main [ref=e95]:
    - generic [ref=e96]:
      - generic [ref=e97]:
        - text: KHÔNG GIAN MUA SẮM
        - heading "Cửa Hàng Sinh Thái GreenLife" [level=1] [ref=e98]
        - paragraph [ref=e99]: Nguồn cung cấp tuyển chọn sản phẩm dưỡng sinh thực vật lành tính. Đảm bảo quy chuẩn hữu cơ đóng gói sinh học cao cấp nhất tại Việt Nam.
      - generic [ref=e100]:
        - generic [ref=e101]:
          - img [ref=e103]
          - generic [ref=e106]:
            - generic [ref=e107]: "VỊ TRÍ & ĐỊA ĐIỂM GIAO HÀNG:"
            - paragraph [ref=e108]: 100 Lê Lợi, Hải Châu, Đà Nẵng
            - paragraph [ref=e109]:
              - text: "Cung cấp bởi đối tác:"
              - strong [ref=e110]: Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng
              - text: (250 Điện Biên Phủ, Thanh Khê, Đà Nẵng, Việt Nam)
        - button "Thay đổi địa chỉ & nhà vườn" [ref=e111] [cursor=pointer]:
          - generic [ref=e112]: Thay đổi địa chỉ & nhà vườn
          - img [ref=e113]
      - generic [ref=e115]:
        - generic [ref=e116]:
          - generic [ref=e117]:
            - img [ref=e118]
            - textbox "Tìm phân trùn quế, dầu neem, sen đá..." [ref=e121]
          - generic [ref=e122]:
            - img [ref=e123]
            - generic [ref=e124]: "Sắp xếp:"
            - combobox [ref=e125]:
              - option "Nổi Bật Nhất" [selected]
              - 'option "Giá: Thấp tới Cao"'
              - 'option "Giá: Cao xuống Thấp"'
              - option "Được Ưa Thích Nhất"
              - option "Điểm Thân Thiện Eco"
        - generic [ref=e126]:
          - button "Tất Cả" [ref=e127] [cursor=pointer]
          - button "Cây Xanh Bản Địa" [ref=e128] [cursor=pointer]
          - button "Trị Bệnh Sinh Học" [ref=e129] [cursor=pointer]
          - button "Dinh Dưỡng Hữu Cơ" [ref=e130] [cursor=pointer]
          - button "IoT Smart Home" [ref=e131] [cursor=pointer]
      - generic [ref=e132]:
        - img [ref=e133]
        - generic [ref=e136]:
          - text: Bạn đang xem các sản phẩm sinh học được tối ưu giao nhanh từ chi nhánh
          - strong [ref=e137]: Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng
          - text: .
      - generic [ref=e138]:
        - img [ref=e140]
        - generic [ref=e143]:
          - heading "Không tìm thấy sản phẩm" [level=3] [ref=e144]
          - paragraph [ref=e145]: Không tìm thấy sản phẩm nào khớp với bộ lọc hoặc tìm kiếm của bạn.
        - button "Reset bộ lọc" [ref=e146] [cursor=pointer]
  - contentinfo [ref=e147]:
    - generic [ref=e148]:
      - generic [ref=e149]:
        - generic [ref=e150]: GreenLife
        - paragraph [ref=e151]: Nền tảng sinh thái tích hợp AI chuyên chẩn đoán, hỗ trợ vườn nhà và kết nối cung ứng sản phẩm organic thân thiện với môi trường Việt Nam.
        - generic [ref=e152]: © 2026 GREENLIFE CORP • BẰNG SÁNG CHẾ VIỆT NAM
      - generic [ref=e153]:
        - heading "Dịch vụ cốt lõi" [level=4] [ref=e154]
        - list [ref=e155]:
          - listitem [ref=e156]:
            - button "Bác sĩ cây trồng AI (Gemini 3.5)" [ref=e157]
          - listitem [ref=e158]:
            - button "Thương mại điện tử hữu cơ" [ref=e159]
          - listitem [ref=e160]:
            - button "Danh bạ chuyên gia nông nghiệp" [ref=e161]
          - listitem [ref=e162]:
            - button "Truyền thông & Đào tạo xanh" [ref=e163]
      - generic [ref=e164]:
        - heading "Quy chuẩn cam kết" [level=4] [ref=e165]
        - list [ref=e166]:
          - listitem [ref=e167]:
            - generic [ref=e168]: "Tiêu chuẩn canh tác:"
            - text: Organic Việt Nam & Global GAP
          - listitem [ref=e169]:
            - generic [ref=e170]: "Đóng gói bền vững:"
            - text: 100% Túi tự phân hủy sinh học
          - listitem [ref=e171]:
            - generic [ref=e172]: "Lượng carbon tích lũy:"
            - text: "-750,000 kg CO2đã trung hòa"
      - generic [ref=e173]:
        - heading "Liên hệ bản địa" [level=4] [ref=e174]
        - paragraph [ref=e175]: Hợp tác xã Công nghệ xanh Hòa Lạc, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam.
        - paragraph [ref=e176]: "hotline: 1800-ECO-GREEN"
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
  22  |   await page.getByRole("button", { name: /đăng nhập/i }).click();
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
> 34  |   await page.getByRole("button", { name: /thêm vào giỏ/i }).first().click();
      |                                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
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