# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-diagnosis.spec.ts >> AI Diagnosis Flow >> TC-AI-04: Submitting diagnosis shows loading state
- Location: src\tests\e2e\ai-diagnosis.spec.ts:65:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /chẩn đoán|phân tích/i })
    - locator resolved to <button disabled class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-850 disabled:text-stone-600 font-semibold text-sm text-black rounded-xl cursor-pointer transition-all">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    50 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

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
      - link "Bác Sĩ Cây AI" [active] [ref=e47] [cursor=pointer]:
        - generic [ref=e48]:
          - img [ref=e49]
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
        - text: TRÁM CHẨN ĐOÁN CÔNG NGHỆ CAO
        - heading "Chẩn Đoán Bệnh Cây AI" [level=1] [ref=e83]:
          - img [ref=e84]
          - text: Chẩn Đoán Bệnh Cây AI
        - paragraph [ref=e96]: Ứng dụng phát hiện tự động hơn 150 loại vi nấm, sâu xanh rệp, thối nhũn và sự cố dinh dưỡng hữu cơ nhờ AI sinh học. Đưa cây hồi sinh khỏe mạnh chỉ sau một phác đồ dứt điểm.
      - generic [ref=e97]:
        - generic [ref=e98]:
          - heading "Console Máy Quét Thực Địa" [level=3] [ref=e99]
          - generic [ref=e101] [cursor=pointer]:
            - img [ref=e103]
            - generic [ref=e106]:
              - paragraph [ref=e107]: Kéo thả ảnh bệnh lá hoặc Nhấp để chọn
              - paragraph [ref=e108]: Hỗ trợ PNG, JPG dung lượng tối đa 10MB
          - generic [ref=e109]:
            - generic [ref=e110]: "CHỌN CHẨN ĐOÁN MẪU THỬ NHANH:"
            - generic [ref=e111]:
              - button "Cà chua bị mốc sương (Phytophthora infestans) Cà chua bị mốc sương (Phytophthora infestans) Cây cà chua hữu cơ ban công" [ref=e112]:
                - img "Cà chua bị mốc sương (Phytophthora infestans)" [ref=e113]
                - generic [ref=e114]:
                  - generic [ref=e115]: Cà chua bị mốc sương (Phytophthora infestans)
                  - generic [ref=e116]: Cây cà chua hữu cơ ban công
              - button "Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm) Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm) Sen đá thạch ngọc quý" [ref=e117]:
                - img "Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm)" [ref=e118]
                - generic [ref=e119]:
                  - generic [ref=e120]: Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm)
                  - generic [ref=e121]: Sen đá thạch ngọc quý
              - button "Bọ trĩ mặt dưới lá và héo ngọn hoa hồng Bọ trĩ mặt dưới lá và héo ngọn hoa hồng Hồng leo cổ Hải Phòng" [ref=e122]:
                - img "Bọ trĩ mặt dưới lá và héo ngọn hoa hồng" [ref=e123]
                - generic [ref=e124]:
                  - generic [ref=e125]: Bọ trĩ mặt dưới lá và héo ngọn hoa hồng
                  - generic [ref=e126]: Hồng leo cổ Hải Phòng
          - button "Đặt Lệnh Chẩn Đoán AI" [disabled] [ref=e127] [cursor=pointer]:
            - img [ref=e128]
            - text: Đặt Lệnh Chẩn Đoán AI
        - generic [ref=e141]:
          - img [ref=e143]
          - generic [ref=e155]:
            - heading "Chưa có spec chẩn đoán nào được tải" [level=3] [ref=e156]
            - paragraph [ref=e157]: Hãy thả ảnh nghi vấn sâu hại của bạn vào mô-đun máy quét ngoài ra hứa hẹn hoặc trải nghiệm tức thì phác đồ phục hồi bằng cách chọn các dịch bệnh mẫu ở trái màn hình.
  - contentinfo [ref=e158]:
    - generic [ref=e159]:
      - generic [ref=e160]:
        - generic [ref=e161]: GreenLife
        - paragraph [ref=e162]: Nền tảng sinh thái tích hợp AI chuyên chẩn đoán, hỗ trợ vườn nhà và kết nối cung ứng sản phẩm organic thân thiện với môi trường Việt Nam.
        - generic [ref=e163]: © 2026 GREENLIFE CORP • BẰNG SÁNG CHẾ VIỆT NAM
      - generic [ref=e164]:
        - heading "Dịch vụ cốt lõi" [level=4] [ref=e165]
        - list [ref=e166]:
          - listitem [ref=e167]:
            - button "Bác sĩ cây trồng AI (Gemini 3.5)" [ref=e168]
          - listitem [ref=e169]:
            - button "Thương mại điện tử hữu cơ" [ref=e170]
          - listitem [ref=e171]:
            - button "Danh bạ chuyên gia nông nghiệp" [ref=e172]
          - listitem [ref=e173]:
            - button "Truyền thông & Đào tạo xanh" [ref=e174]
      - generic [ref=e175]:
        - heading "Quy chuẩn cam kết" [level=4] [ref=e176]
        - list [ref=e177]:
          - listitem [ref=e178]:
            - generic [ref=e179]: "Tiêu chuẩn canh tác:"
            - text: Organic Việt Nam & Global GAP
          - listitem [ref=e180]:
            - generic [ref=e181]: "Đóng gói bền vững:"
            - text: 100% Túi tự phân hủy sinh học
          - listitem [ref=e182]:
            - generic [ref=e183]: "Lượng carbon tích lũy:"
            - text: "-750,000 kg CO2đã trung hòa"
      - generic [ref=e184]:
        - heading "Liên hệ bản địa" [level=4] [ref=e185]
        - paragraph [ref=e186]: Hợp tác xã Công nghệ xanh Hòa Lạc, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam.
        - paragraph [ref=e187]: "hotline: 1800-ECO-GREEN"
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
> 71  |       await diagnoseBtn.click();
      |                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  93  |     await expect(page.getByText(/lịch sử chẩn đoán/i)).toBeVisible({ timeout: 5000 });
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