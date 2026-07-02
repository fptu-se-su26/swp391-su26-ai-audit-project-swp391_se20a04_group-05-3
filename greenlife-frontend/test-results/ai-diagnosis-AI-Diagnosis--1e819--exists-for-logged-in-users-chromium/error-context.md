# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-diagnosis.spec.ts >> AI Diagnosis Flow >> TC-AI-05: Diagnosis history section exists for logged-in users
- Location: src\tests\e2e\ai-diagnosis.spec.ts:81:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/lịch sử chẩn đoán/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/lịch sử chẩn đoán/i)

```

```yaml
- banner:
  - text: Green Life
  - paragraph: ECO-TECH LUXURY
  - text: "GREEN LIFE Vườn:"
  - strong: Thảo Mộc Đô Thị GreenLife Đà Nẵng
  - button "Đổi giao diện"
  - button "Giỏ hàng"
  - button "Thông báo"
  - 'button "Tài khoản: Nguyễn Thị Lan (customer)"'
  - button "Đăng xuất"
  - navigation:
    - link "Trang Chủ"
    - link "Cửa Hàng"
    - link "Bác Sĩ Cây AI"
    - link "Danh Bạ Chuyên Gia"
    - link "Cẩm Nang Xanh"
    - link "Hồ Sơ Của Tôi 👤"
  - paragraph:
    - text: "Cam kết môi trường:"
    - strong: 100%
    - text: canh tác hữu cơ bền vững Việt Nam
- main:
  - text: TRÁM CHẨN ĐOÁN CÔNG NGHỆ CAO
  - heading "Chẩn Đoán Bệnh Cây AI" [level=1]
  - paragraph: Ứng dụng phát hiện tự động hơn 150 loại vi nấm, sâu xanh rệp, thối nhũn và sự cố dinh dưỡng hữu cơ nhờ AI sinh học. Đưa cây hồi sinh khỏe mạnh chỉ sau một phác đồ dứt điểm.
  - heading "Console Máy Quét Thực Địa" [level=3]
  - paragraph: Kéo thả ảnh bệnh lá hoặc Nhấp để chọn
  - paragraph: Hỗ trợ PNG, JPG dung lượng tối đa 10MB
  - text: "CHỌN CHẨN ĐOÁN MẪU THỬ NHANH:"
  - button "Cà chua bị mốc sương (Phytophthora infestans) Cà chua bị mốc sương (Phytophthora infestans) Cây cà chua hữu cơ ban công":
    - img "Cà chua bị mốc sương (Phytophthora infestans)"
    - text: Cà chua bị mốc sương (Phytophthora infestans) Cây cà chua hữu cơ ban công
  - button "Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm) Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm) Sen đá thạch ngọc quý":
    - img "Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm)"
    - text: Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm) Sen đá thạch ngọc quý
  - button "Bọ trĩ mặt dưới lá và héo ngọn hoa hồng Bọ trĩ mặt dưới lá và héo ngọn hoa hồng Hồng leo cổ Hải Phòng":
    - img "Bọ trĩ mặt dưới lá và héo ngọn hoa hồng"
    - text: Bọ trĩ mặt dưới lá và héo ngọn hoa hồng Hồng leo cổ Hải Phòng
  - button "Đặt Lệnh Chẩn Đoán AI" [disabled]
  - heading "Chưa có spec chẩn đoán nào được tải" [level=3]
  - paragraph: Hãy thả ảnh nghi vấn sâu hại của bạn vào mô-đun máy quét ngoài ra hứa hẹn hoặc trải nghiệm tức thì phác đồ phục hồi bằng cách chọn các dịch bệnh mẫu ở trái màn hình.
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
  2   |  * ai-diagnosis.spec.ts — GreenLife AI Plant Diagnosis E2E Tests
  3   |  *
  4   |  * Prerequisites:
  5   |  *   npm install -D @playwright/test
  6   |  *   npx playwright install
  7   |  *
  8   |  * Run:
  9   |  *   npx playwright test src/tests/e2e/ai-diagnosis.spec.ts
  10  |  */
  11  | 
  12  | import { test, expect, Page } from "@playwright/test";
  13  | import path from "path";
  14  | 
  15  | const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  16  | 
  17  | // ---------------------------------------------------------------------------
  18  | // Helpers
  19  | // ---------------------------------------------------------------------------
  20  | 
  21  | async function goToDiagnosisPage(page: Page) {
  22  |   await page.goto(BASE_URL);
  23  |   // AI Diagnosis is accessible without login per the access policy
  24  |   await page.getByRole("link", { name: /ai|chẩn đoán/i }).click();
  25  |   await expect(page.getByRole("heading", { name: /chẩn đoán/i }).first()).toBeVisible({ timeout: 8000 });
  26  | }
  27  | 
  28  | // ---------------------------------------------------------------------------
  29  | // Test suite: AI Diagnosis
  30  | // ---------------------------------------------------------------------------
  31  | 
  32  | test.describe("AI Diagnosis Flow", () => {
  33  |   // -------------------------------------------------------------------------
  34  |   test("TC-AI-01: AI Diagnosis page is accessible to guests", async ({ page }) => {
  35  |     await goToDiagnosisPage(page);
  36  |     // Upload section should be visible
  37  |     await expect(page.getByText(/tải ảnh lên|chụp ảnh/i)).toBeVisible();
  38  |   });
  39  | 
  40  |   // -------------------------------------------------------------------------
  41  |   test("TC-AI-02: Camera toggle button is visible", async ({ page }) => {
  42  |     await goToDiagnosisPage(page);
  43  |     await expect(page.getByRole("button", { name: /camera|webcam/i })).toBeVisible();
  44  |   });
  45  | 
  46  |   // -------------------------------------------------------------------------
  47  |   test("TC-AI-03: File upload input accepts image files", async ({ page }) => {
  48  |     await goToDiagnosisPage(page);
  49  |     const fileInput = page.locator("input[type='file']");
  50  |     await expect(fileInput).toBeAttached();
  51  | 
  52  |     // Upload a mock image (requires test fixture file)
  53  |     const testImagePath = path.resolve(__dirname, "../fixtures/test-leaf.jpg");
  54  |     try {
  55  |       await fileInput.setInputFiles(testImagePath);
  56  |       // If the fixture exists, preview should appear
  57  |       await expect(page.locator("img[alt*='preview']")).toBeVisible({ timeout: 3000 });
  58  |     } catch {
  59  |       // Fixture not present — skip visual check
  60  |       test.skip();
  61  |     }
  62  |   });
  63  | 
  64  |   // -------------------------------------------------------------------------
  65  |   test("TC-AI-04: Submitting diagnosis shows loading state", async ({ page }) => {
  66  |     await goToDiagnosisPage(page);
  67  | 
  68  |     // Attempt to click diagnose button (without image — should show validation)
  69  |     const diagnoseBtn = page.getByRole("button", { name: /chẩn đoán|phân tích/i });
  70  |     if (await diagnoseBtn.isVisible()) {
  71  |       await diagnoseBtn.click();
  72  | 
  73  |       // Either a validation message or loading state should appear
  74  |       const isValidating = await page.getByText(/vui lòng|chọn ảnh/i).isVisible();
  75  |       const isLoading = await page.getByRole("progressbar").isVisible();
  76  |       expect(isValidating || isLoading).toBeTruthy();
  77  |     }
  78  |   });
  79  | 
  80  |   // -------------------------------------------------------------------------
  81  |   test("TC-AI-05: Diagnosis history section exists for logged-in users", async ({ page }) => {
  82  |     // Login first
  83  |     await page.goto(BASE_URL);
  84  |     await page.getByRole("button", { name: /đăng nhập/i }).click();
  85  |     await page.getByLabel(/email/i).fill("customer@greenlife.vn");
  86  |     await page.getByLabel(/mật khẩu/i).fill("Password123!");
  87  |     await page.getByRole("button", { name: /^đăng nhập$/i }).click();
  88  |     await page.waitForTimeout(2000);
  89  | 
  90  |     await goToDiagnosisPage(page);
  91  | 
  92  |     // Diagnosis history panel should appear for authenticated users
> 93  |     await expect(page.getByText(/lịch sử chẩn đoán/i)).toBeVisible({ timeout: 5000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  94  |   });
  95  | 
  96  |   // -------------------------------------------------------------------------
  97  |   test("TC-AI-06: Product recommendations appear after diagnosis", async ({ page }) => {
  98  |     // This test requires actual AI backend — marked as slow test
  99  |     test.slow();
  100 |     await goToDiagnosisPage(page);
  101 | 
  102 |     // Placeholder: verify product recommendation section structure exists
  103 |     // Full test requires mocked AI response or real backend
  104 |     await expect(page.getByText(/sản phẩm gợi ý|đề xuất/i).first()).toBeVisible({ timeout: 3000 });
  105 |   });
  106 | });
  107 | 
```