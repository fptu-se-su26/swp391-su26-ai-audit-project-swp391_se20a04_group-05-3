# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Shop Flow >> TC-SHOP-04: Sort dropdown changes order
- Location: src\tests\e2e\shop.spec.ts:72:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid=\'product-card\']').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid=\'product-card\']').first()

```

```yaml
- banner:
  - text: Green Life
  - paragraph: ECO-TECH LUXURY
  - text: "GREEN LIFE Vườn:"
  - strong: Thảo Mộc Đô Thị GreenLife Đà Nẵng
  - button "Đổi giao diện"
  - button "Giỏ hàng"
  - button "Tài khoản / Đăng nhập"
  - navigation:
    - link "Trang Chủ"
    - link "Cửa Hàng"
    - link "Bác Sĩ Cây AI"
    - link "Danh Bạ Chuyên Gia"
    - link "Cẩm Nang Xanh"
  - paragraph:
    - text: "Cam kết môi trường:"
    - strong: 100%
    - text: canh tác hữu cơ bền vững Việt Nam
- main:
  - text: KHÔNG GIAN MUA SẮM
  - heading "Cửa Hàng Sinh Thái GreenLife" [level=1]
  - paragraph: Nguồn cung cấp tuyển chọn sản phẩm dưỡng sinh thực vật lành tính. Đảm bảo quy chuẩn hữu cơ đóng gói sinh học cao cấp nhất tại Việt Nam.
  - text: "VỊ TRÍ & ĐỊA ĐIỂM GIAO HÀNG:"
  - paragraph: 100 Lê Lợi, Hải Châu, Đà Nẵng
  - paragraph:
    - text: "Cung cấp bởi đối tác:"
    - strong: Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng
    - text: (250 Điện Biên Phủ, Thanh Khê, Đà Nẵng, Việt Nam)
  - button "Thay đổi địa chỉ & nhà vườn"
  - textbox "Tìm phân trùn quế, dầu neem, sen đá..."
  - text: "Sắp xếp:"
  - combobox:
    - option "Nổi Bật Nhất"
    - 'option "Giá: Thấp tới Cao" [selected]'
    - 'option "Giá: Cao xuống Thấp"'
    - option "Được Ưa Thích Nhất"
    - option "Điểm Thân Thiện Eco"
  - button "Tất Cả"
  - button "Cây Xanh Bản Địa"
  - button "Trị Bệnh Sinh Học"
  - button "Dinh Dưỡng Hữu Cơ"
  - button "IoT Smart Home"
  - text: Bạn đang xem các sản phẩm sinh học được tối ưu giao nhanh từ chi nhánh
  - strong: Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng
  - text: .
  - heading "Không tìm thấy sản phẩm" [level=3]
  - paragraph: Không tìm thấy sản phẩm nào khớp với bộ lọc hoặc tìm kiếm của bạn.
  - button "Reset bộ lọc"
- contentinfo:
  - text: GreenLife
  - paragraph: Nền tảng sinh thái tích hợp AI chuyên chẩn đoán, hỗ trợ vườn nhà và kết nối cung ứng sản phẩm organic thân thiện với môi trường Việt Nam.
  - text: © 2026 GREENLIFE CORP • BẰNG SÁNG CHẾ VIỆT NAM
  - heading "Dịch vụ cốt lõi" [level=4]
  - list:
    - listitem:
      - button "Bác sĩ cây trồng AI (Gemini 3.5)"
    - listitem:
      - button "Thương mại điện tử hữu cơ"
    - listitem:
      - button "Danh bạ chuyên gia nông nghiệp"
    - listitem:
      - button "Truyền thông & Đào tạo xanh"
  - heading "Quy chuẩn cam kết" [level=4]
  - list:
    - listitem: "Tiêu chuẩn canh tác: Organic Việt Nam & Global GAP"
    - listitem: "Đóng gói bền vững: 100% Túi tự phân hủy sinh học"
    - listitem: "Lượng carbon tích lũy: -750,000 kg CO2đã trung hòa"
  - heading "Liên hệ bản địa" [level=4]
  - paragraph: Hợp tác xã Công nghệ xanh Hòa Lạc, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam.
  - paragraph: "hotline: 1800-ECO-GREEN"
```

# Test source

```ts
  1   | /**
  2   |  * shop.spec.ts — GreenLife Shop Flow E2E Tests
  3   |  *
  4   |  * Prerequisites:
  5   |  *   npm install -D @playwright/test
  6   |  *   npx playwright install
  7   |  *
  8   |  * Run:
  9   |  *   npx playwright test src/tests/e2e/shop.spec.ts
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
  20  | async function goToShop(page: Page) {
  21  |   await page.goto(BASE_URL);
  22  |   await page.getByRole("link", { name: /cửa hàng/i }).click();
  23  |   await expect(page.getByRole("heading", { name: /cửa hàng sinh thái/i })).toBeVisible({
  24  |     timeout: 8000,
  25  |   });
  26  | }
  27  | 
  28  | // ---------------------------------------------------------------------------
  29  | // Test suite: Guest — Shop browsing
  30  | // ---------------------------------------------------------------------------
  31  | 
  32  | test.describe("Shop Flow", () => {
  33  |   test.beforeEach(async ({ page }) => {
  34  |     await goToShop(page);
  35  |   });
  36  | 
  37  |   // -------------------------------------------------------------------------
  38  |   test("TC-SHOP-01: Shop page loads product grid", async ({ page }) => {
  39  |     // Product cards should appear
  40  |     await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({
  41  |       timeout: 8000,
  42  |     });
  43  |   });
  44  | 
  45  |   // -------------------------------------------------------------------------
  46  |   test("TC-SHOP-02: Search filters products correctly", async ({ page }) => {
  47  |     const searchInput = page.getByPlaceholder(/tìm phân trùn/i);
  48  |     await searchInput.fill("sen đá");
  49  | 
  50  |     // Wait for debounce (400 ms) + API response
  51  |     await page.waitForTimeout(800);
  52  | 
  53  |     // Verify at least one result or empty state renders
  54  |     const hasResults = await page.locator("[data-testid='product-card']").count();
  55  |     const hasEmptyState = await page.getByText(/không tìm thấy sản phẩm/i).isVisible();
  56  |     expect(hasResults > 0 || hasEmptyState).toBeTruthy();
  57  |   });
  58  | 
  59  |   // -------------------------------------------------------------------------
  60  |   test("TC-SHOP-03: Category filter narrows results", async ({ page }) => {
  61  |     // Click the "Cây Xanh Bản Địa" category pill
  62  |     await page.getByRole("button", { name: /cây xanh bản địa/i }).click();
  63  |     await page.waitForTimeout(800);
  64  | 
  65  |     // Expect product grid to have updated
  66  |     await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({
  67  |       timeout: 5000,
  68  |     });
  69  |   });
  70  | 
  71  |   // -------------------------------------------------------------------------
  72  |   test("TC-SHOP-04: Sort dropdown changes order", async ({ page }) => {
  73  |     const sortSelect = page.getByRole("combobox");
  74  |     await sortSelect.selectOption("price-asc");
  75  |     await page.waitForTimeout(500);
  76  | 
  77  |     // Expect page to re-render (no crash)
> 78  |     await expect(page.locator("[data-testid='product-card']").first()).toBeVisible();
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  79  |   });
  80  | 
  81  |   // -------------------------------------------------------------------------
  82  |   test("TC-SHOP-05: Clicking product card navigates to product detail", async ({ page }) => {
  83  |     await page.locator("[data-testid='product-card']").first().click();
  84  | 
  85  |     // Product detail page should show
  86  |     await expect(page.getByText(/thêm vào giỏ/i)).toBeVisible({ timeout: 5000 });
  87  |   });
  88  | 
  89  |   // -------------------------------------------------------------------------
  90  |   test("TC-SHOP-06: Product detail shows reviews section", async ({ page }) => {
  91  |     await page.locator("[data-testid='product-card']").first().click();
  92  |     await expect(page.getByText(/đánh giá từ khách hàng/i)).toBeVisible({ timeout: 5000 });
  93  |   });
  94  | 
  95  |   // -------------------------------------------------------------------------
  96  |   test("TC-SHOP-07: Blog navigation works from navigation", async ({ page }) => {
  97  |     await page.goto(BASE_URL);
  98  |     await page.getByRole("link", { name: /cẩm nang/i }).click();
  99  |     await expect(page.getByRole("heading", { name: /cẩm nang xanh/i })).toBeVisible({
  100 |       timeout: 8000,
  101 |     });
  102 |   });
  103 | });
  104 | 
```