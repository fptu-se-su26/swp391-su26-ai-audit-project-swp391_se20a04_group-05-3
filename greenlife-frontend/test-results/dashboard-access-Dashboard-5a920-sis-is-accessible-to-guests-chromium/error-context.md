# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-access.spec.ts >> Dashboard Access Control (RBAC) >> TC-RBAC-08: AI Diagnosis is accessible to guests
- Location: src\tests\e2e\dashboard-access.spec.ts:113:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /chẩn đoán/i })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: /chẩn đoán/i }) resolved to 2 elements:
    1) <h1 class="text-3xl sm:text-4xl font-display font-bold text-stone-100 tracking-tight flex items-center gap-2">…</h1> aka getByRole('heading', { name: 'Chẩn Đoán Bệnh Cây AI' })
    2) <h3 class="font-display font-medium text-stone-200 text-sm">Chưa có spec chẩn đoán nào được tải</h3> aka getByRole('heading', { name: 'Chưa có spec chẩn đoán nào' })

Call log:
  - Expect "toBeVisible" with timeout 6000ms
  - waiting for getByRole('heading', { name: /chẩn đoán/i })

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
  17  | // Helpers
  18  | // ---------------------------------------------------------------------------
  19  | 
  20  | async function loginAs(page: Page, role: "customer" | "store" | "admin") {
  21  |   const credentials: Record<string, { email: string; password: string }> = {
  22  |     customer: { email: "customer@greenlife.vn", password: "Password123!" },
  23  |     store: { email: "store@greenlife.vn", password: "Password123!" },
  24  |     admin: { email: "admin@greenlife.vn", password: "AdminPass123!" },
  25  |   };
  26  | 
  27  |   await page.goto(BASE_URL);
  28  |   await page.getByRole("button", { name: /đăng nhập/i }).click();
  29  |   await page.getByLabel(/email/i).fill(credentials[role].email);
  30  |   await page.getByLabel(/mật khẩu/i).fill(credentials[role].password);
  31  |   await page.getByRole("button", { name: /^đăng nhập$/i }).click();
  32  |   await page.waitForTimeout(2500);
  33  | }
  34  | 
  35  | async function navigateToPage(page: Page, pageId: string) {
  36  |   // Trigger navigation by clicking nav links or directly via internal state
  37  |   // In this SPA, navigation is state-driven — use the nav buttons
  38  |   await page.evaluate((p) => {
  39  |     window.dispatchEvent(new CustomEvent("gl-navigate", { detail: { page: p } }));
  40  |   }, pageId);
  41  |   await page.waitForTimeout(1000);
  42  | }
  43  | 
  44  | // ---------------------------------------------------------------------------
  45  | // Test suite: Dashboard Access Control
  46  | // ---------------------------------------------------------------------------
  47  | 
  48  | test.describe("Dashboard Access Control (RBAC)", () => {
  49  |   // -------------------------------------------------------------------------
  50  |   test("TC-RBAC-01: Guest is redirected to auth when accessing customer-dashboard", async ({
  51  |     page,
  52  |   }) => {
  53  |     await page.goto(BASE_URL);
  54  |     // Navigate as guest to customer-dashboard by clicking profile icon
  55  |     await page.getByRole("button", { name: /tài khoản|hồ sơ/i }).click().catch(() => {});
  56  |     await page.waitForTimeout(1000);
  57  | 
  58  |     // Should see auth page, not dashboard content
  59  |     const isAuthPage = await page.getByRole("heading", { name: /đăng nhập/i }).isVisible();
  60  |     const isDashboard = await page.getByText(/đơn mua của tôi/i).isVisible();
  61  |     expect(isAuthPage && !isDashboard).toBeTruthy();
  62  |   });
  63  | 
  64  |   // -------------------------------------------------------------------------
  65  |   test("TC-RBAC-02: Customer cannot access admin-dashboard", async ({ page }) => {
  66  |     await loginAs(page, "customer");
  67  |     // Attempt to navigate to admin dashboard
  68  |     await navigateToPage(page, "admin-dashboard");
  69  | 
  70  |     const isAdminPage = await page.getByText(/quản trị viên|user management/i).isVisible();
  71  |     expect(!isAdminPage).toBeTruthy();
  72  |   });
  73  | 
  74  |   // -------------------------------------------------------------------------
  75  |   test("TC-RBAC-03: Customer cannot access store-dashboard", async ({ page }) => {
  76  |     await loginAs(page, "customer");
  77  |     await navigateToPage(page, "store-dashboard");
  78  | 
  79  |     // Should be redirected home or to profile setup — NOT the store dashboard
  80  |     const isStoreDashboard = await page.getByText(/quản lý đơn hàng cửa hàng/i).isVisible();
  81  |     expect(!isStoreDashboard).toBeTruthy();
  82  |   });
  83  | 
  84  |   // -------------------------------------------------------------------------
  85  |   test("TC-RBAC-04: Customer can access customer-dashboard", async ({ page }) => {
  86  |     await loginAs(page, "customer");
  87  |     await expect(page.getByText(/đơn mua của tôi/i)).toBeVisible({ timeout: 8000 });
  88  |   });
  89  | 
  90  |   // -------------------------------------------------------------------------
  91  |   test("TC-RBAC-05: Store owner can access store-dashboard", async ({ page }) => {
  92  |     await loginAs(page, "store");
  93  |     // Store owners are auto-routed to store dashboard
  94  |     await expect(page.getByText(/doanh thu|quản lý sản phẩm/i)).toBeVisible({ timeout: 8000 });
  95  |   });
  96  | 
  97  |   // -------------------------------------------------------------------------
  98  |   test("TC-RBAC-06: Store owner cannot access admin-dashboard", async ({ page }) => {
  99  |     await loginAs(page, "store");
  100 |     await navigateToPage(page, "admin-dashboard");
  101 | 
  102 |     const isAdminPage = await page.getByText(/phê duyệt nhà vườn/i).isVisible();
  103 |     expect(!isAdminPage).toBeTruthy();
  104 |   });
  105 | 
  106 |   // -------------------------------------------------------------------------
  107 |   test("TC-RBAC-07: Admin can access admin-dashboard", async ({ page }) => {
  108 |     await loginAs(page, "admin");
  109 |     await expect(page.getByText(/phê duyệt nhà vườn|quản trị/i)).toBeVisible({ timeout: 8000 });
  110 |   });
  111 | 
  112 |   // -------------------------------------------------------------------------
  113 |   test("TC-RBAC-08: AI Diagnosis is accessible to guests", async ({ page }) => {
  114 |     await page.goto(BASE_URL);
  115 |     await page.getByRole("link", { name: /ai|chẩn đoán/i }).click();
  116 |     // Should load diagnosis page without auth challenge
> 117 |     await expect(page.getByRole("heading", { name: /chẩn đoán/i })).toBeVisible({ timeout: 6000 });
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  118 |   });
  119 | 
  120 |   // -------------------------------------------------------------------------
  121 |   test("TC-RBAC-09: Expert Directory is accessible to guests", async ({ page }) => {
  122 |     await page.goto(BASE_URL);
  123 |     await page.getByRole("link", { name: /chuyên gia|đặt lịch/i }).click();
  124 |     await expect(page.getByRole("heading", { name: /chuyên gia/i })).toBeVisible({ timeout: 6000 });
  125 |   });
  126 | 
  127 |   // -------------------------------------------------------------------------
  128 |   test("TC-RBAC-10: store-profile-setup requires store or admin role", async ({ page }) => {
  129 |     await loginAs(page, "customer");
  130 |     await navigateToPage(page, "store-profile-setup");
  131 | 
  132 |     // Customer should not land on seller setup page
  133 |     const isSetupPage = await page.getByText(/đăng ký bán hàng|hồ sơ nhà vườn/i).isVisible();
  134 |     // ProtectedRoute redirects customers — they should see home or customer-dashboard
  135 |     const isRedirected = await page.getByText(/cửa hàng sinh thái|đơn mua/i).isVisible();
  136 |     expect(!isSetupPage || isRedirected).toBeTruthy();
  137 |   });
  138 | });
  139 | 
```