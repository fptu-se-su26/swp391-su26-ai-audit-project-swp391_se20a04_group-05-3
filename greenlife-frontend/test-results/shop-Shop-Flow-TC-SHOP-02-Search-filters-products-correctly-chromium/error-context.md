# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Shop Flow >> TC-SHOP-02: Search filters products correctly
- Location: src\tests\e2e\shop.spec.ts:46:3

# Error details

```
Error: locator.isVisible: Error: strict mode violation: getByText(/không tìm thấy sản phẩm/i) resolved to 2 elements:
    1) <h3 class="text-base font-bold text-white tracking-tight">Không tìm thấy sản phẩm</h3> aka getByRole('heading', { name: 'Không tìm thấy sản phẩm' })
    2) <p class="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">Không tìm thấy sản phẩm nào khớp với bộ lọc hoặc …</p> aka getByText('Không tìm thấy sản phẩm nào')

Call log:
    - checking visibility of getByText(/không tìm thấy sản phẩm/i)

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
        - button "Tài khoản / Đăng nhập" [ref=e31] [cursor=pointer]:
          - img [ref=e32]
    - navigation [ref=e36]:
      - link "Trang Chủ" [ref=e37] [cursor=pointer]:
        - generic [ref=e38]:
          - img [ref=e39]
          - text: Trang Chủ
      - link "Cửa Hàng" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]:
          - img [ref=e44]
          - text: Cửa Hàng
      - link "Bác Sĩ Cây AI" [ref=e48] [cursor=pointer]:
        - generic [ref=e49]:
          - img [ref=e50]
          - text: Bác Sĩ Cây AI
      - link "Danh Bạ Chuyên Gia" [ref=e62] [cursor=pointer]:
        - generic [ref=e63]:
          - img [ref=e64]
          - text: Danh Bạ Chuyên Gia
      - link "Cẩm Nang Xanh" [ref=e69] [cursor=pointer]:
        - generic [ref=e70]:
          - img [ref=e71]
          - text: Cẩm Nang Xanh
    - paragraph [ref=e78]:
      - text: "Cam kết môi trường:"
      - strong [ref=e79]: 100%
      - text: canh tác hữu cơ bền vững Việt Nam
  - main [ref=e80]:
    - generic [ref=e81]:
      - generic [ref=e82]:
        - text: KHÔNG GIAN MUA SẮM
        - heading "Cửa Hàng Sinh Thái GreenLife" [level=1] [ref=e83]
        - paragraph [ref=e84]: Nguồn cung cấp tuyển chọn sản phẩm dưỡng sinh thực vật lành tính. Đảm bảo quy chuẩn hữu cơ đóng gói sinh học cao cấp nhất tại Việt Nam.
      - generic [ref=e85]:
        - generic [ref=e86]:
          - img [ref=e88]
          - generic [ref=e91]:
            - generic [ref=e92]: "VỊ TRÍ & ĐỊA ĐIỂM GIAO HÀNG:"
            - paragraph [ref=e93]: 100 Lê Lợi, Hải Châu, Đà Nẵng
            - paragraph [ref=e94]:
              - text: "Cung cấp bởi đối tác:"
              - strong [ref=e95]: Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng
              - text: (250 Điện Biên Phủ, Thanh Khê, Đà Nẵng, Việt Nam)
        - button "Thay đổi địa chỉ & nhà vườn" [ref=e96] [cursor=pointer]:
          - generic [ref=e97]: Thay đổi địa chỉ & nhà vườn
          - img [ref=e98]
      - generic [ref=e100]:
        - generic [ref=e101]:
          - generic [ref=e102]:
            - img [ref=e103]
            - textbox "Tìm phân trùn quế, dầu neem, sen đá..." [active] [ref=e106]: sen đá
          - generic [ref=e107]:
            - img [ref=e108]
            - generic [ref=e109]: "Sắp xếp:"
            - combobox [ref=e110]:
              - option "Nổi Bật Nhất" [selected]
              - 'option "Giá: Thấp tới Cao"'
              - 'option "Giá: Cao xuống Thấp"'
              - option "Được Ưa Thích Nhất"
              - option "Điểm Thân Thiện Eco"
        - generic [ref=e111]:
          - button "Tất Cả" [ref=e112] [cursor=pointer]
          - button "Cây Xanh Bản Địa" [ref=e113] [cursor=pointer]
          - button "Trị Bệnh Sinh Học" [ref=e114] [cursor=pointer]
          - button "Dinh Dưỡng Hữu Cơ" [ref=e115] [cursor=pointer]
          - button "IoT Smart Home" [ref=e116] [cursor=pointer]
      - generic [ref=e117]:
        - img [ref=e118]
        - generic [ref=e121]:
          - text: Bạn đang xem các sản phẩm sinh học được tối ưu giao nhanh từ chi nhánh
          - strong [ref=e122]: Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng
          - text: .
      - generic [ref=e123]:
        - img [ref=e125]
        - generic [ref=e128]:
          - heading "Không tìm thấy sản phẩm" [level=3] [ref=e129]
          - paragraph [ref=e130]: Không tìm thấy sản phẩm nào khớp với bộ lọc hoặc tìm kiếm của bạn.
        - button "Reset bộ lọc" [ref=e131] [cursor=pointer]
  - contentinfo [ref=e132]:
    - generic [ref=e133]:
      - generic [ref=e134]:
        - generic [ref=e135]: GreenLife
        - paragraph [ref=e136]: Nền tảng sinh thái tích hợp AI chuyên chẩn đoán, hỗ trợ vườn nhà và kết nối cung ứng sản phẩm organic thân thiện với môi trường Việt Nam.
        - generic [ref=e137]: © 2026 GREENLIFE CORP • BẰNG SÁNG CHẾ VIỆT NAM
      - generic [ref=e138]:
        - heading "Dịch vụ cốt lõi" [level=4] [ref=e139]
        - list [ref=e140]:
          - listitem [ref=e141]:
            - button "Bác sĩ cây trồng AI (Gemini 3.5)" [ref=e142]
          - listitem [ref=e143]:
            - button "Thương mại điện tử hữu cơ" [ref=e144]
          - listitem [ref=e145]:
            - button "Danh bạ chuyên gia nông nghiệp" [ref=e146]
          - listitem [ref=e147]:
            - button "Truyền thông & Đào tạo xanh" [ref=e148]
      - generic [ref=e149]:
        - heading "Quy chuẩn cam kết" [level=4] [ref=e150]
        - list [ref=e151]:
          - listitem [ref=e152]:
            - generic [ref=e153]: "Tiêu chuẩn canh tác:"
            - text: Organic Việt Nam & Global GAP
          - listitem [ref=e154]:
            - generic [ref=e155]: "Đóng gói bền vững:"
            - text: 100% Túi tự phân hủy sinh học
          - listitem [ref=e156]:
            - generic [ref=e157]: "Lượng carbon tích lũy:"
            - text: "-750,000 kg CO2đã trung hòa"
      - generic [ref=e158]:
        - heading "Liên hệ bản địa" [level=4] [ref=e159]
        - paragraph [ref=e160]: Hợp tác xã Công nghệ xanh Hòa Lạc, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam.
        - paragraph [ref=e161]: "hotline: 1800-ECO-GREEN"
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
> 55  |     const hasEmptyState = await page.getByText(/không tìm thấy sản phẩm/i).isVisible();
      |                                                                            ^ Error: locator.isVisible: Error: strict mode violation: getByText(/không tìm thấy sản phẩm/i) resolved to 2 elements:
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
  78  |     await expect(page.locator("[data-testid='product-card']").first()).toBeVisible();
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