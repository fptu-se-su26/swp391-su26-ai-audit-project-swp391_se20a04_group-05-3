# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-access.spec.ts >> Dashboard Access Control (RBAC) >> TC-RBAC-10: store-profile-setup requires store or admin role
- Location: src\tests\e2e\dashboard-access.spec.ts:128:3

# Error details

```
Error: locator.isVisible: Error: strict mode violation: getByText(/cửa hàng sinh thái|đơn mua/i) resolved to 2 elements:
    1) <h3 class="font-display font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">…</h3> aka getByRole('heading', { name: 'Đơn Mua Của Tôi' })
    2) <h3 class="text-base font-bold text-white tracking-tight">Không có đơn mua</h3> aka getByRole('heading', { name: 'Không có đơn mua' })

Call log:
    - checking visibility of getByText(/cửa hàng sinh thái|đơn mua/i)

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
      - link "Cửa Hàng" [ref=e51] [cursor=pointer]:
        - generic [ref=e52]:
          - img [ref=e53]
          - text: Cửa Hàng
      - link "Bác Sĩ Cây AI" [ref=e56] [cursor=pointer]:
        - generic [ref=e57]:
          - img [ref=e58]
          - text: Bác Sĩ Cây AI
      - link "Danh Bạ Chuyên Gia" [ref=e70] [cursor=pointer]:
        - generic [ref=e71]:
          - img [ref=e72]
          - text: Danh Bạ Chuyên Gia
      - link "Cẩm Nang Xanh" [ref=e77] [cursor=pointer]:
        - generic [ref=e78]:
          - img [ref=e79]
          - text: Cẩm Nang Xanh
      - link "Hồ Sơ Của Tôi 👤" [ref=e82] [cursor=pointer]:
        - generic [ref=e83]:
          - img [ref=e84]
          - text: Hồ Sơ Của Tôi 👤
    - paragraph [ref=e93]:
      - text: "Cam kết môi trường:"
      - strong [ref=e94]: 100%
      - text: canh tác hữu cơ bền vững Việt Nam
  - main [ref=e95]:
    - generic [ref=e96]:
      - generic [ref=e97]:
        - generic [ref=e99]:
          - img [ref=e101]
          - generic [ref=e104]:
            - generic [ref=e105]: ⭐ TÀI KHOẢN KHÁCH HÀNG
            - heading "Nguyễn Thị Lan" [level=2] [ref=e106]
            - paragraph [ref=e107]: "ID: GL-CUST-70942"
        - generic [ref=e108]:
          - generic [ref=e109]:
            - generic [ref=e110]: "Ngày tham gia:"
            - generic [ref=e111]: 2026-06-26
          - button "Đăng Ký Bán Hàng 🛒" [ref=e113] [cursor=pointer]
      - generic [ref=e114]:
        - generic [ref=e115]:
          - generic [ref=e116]:
            - heading "Thông Tin Tài Khoản" [level=3] [ref=e117]:
              - img [ref=e118]
              - text: Thông Tin Tài Khoản
            - generic [ref=e120]:
              - generic [ref=e121]:
                - generic [ref=e122]: "Họ tên:"
                - generic [ref=e123]: Nguyễn Thị Lan
              - generic [ref=e124]:
                - generic [ref=e125]: "Email:"
                - generic [ref=e126]:
                  - img [ref=e127]
                  - text: customer@greenlife.vn
              - generic [ref=e130]:
                - generic [ref=e131]: "Vai trò:"
                - generic [ref=e132]: Khách hàng
              - generic [ref=e133]:
                - generic [ref=e134]: "Địa chỉ mặc định:"
                - generic [ref=e135]:
                  - img [ref=e136]
                  - text: 100 Lê Lợi, Hải Châu, Đà Nẵng
          - generic [ref=e139]:
            - generic [ref=e140]:
              - heading "Cửa Hàng Gần Tôi (Đà Nẵng)" [level=3] [ref=e141]:
                - img [ref=e142]
                - text: Cửa Hàng Gần Tôi (Đà Nẵng)
              - paragraph [ref=e145]: Các đối tác cung ứng cây cảnh & chế phẩm sinh học quanh khu vực của bạn.
            - generic [ref=e146]:
              - generic [ref=e147]:
                - generic [ref=e148]:
                  - generic [ref=e149]:
                    - heading "Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng" [level=4] [ref=e150]
                    - paragraph [ref=e151]: 250 Điện Biên Phủ, Thanh Khê, Đà Nẵng, Việt Nam
                  - generic [ref=e152]: ⭐ 4.9
                - generic [ref=e153]:
                  - generic [ref=e154]: 🕒 07:30 - 18:00 (Hằng ngày)
                  - generic [ref=e155]:
                    - text: "Khu vực giao:"
                    - strong [ref=e156]: Thanh Khê, Hải Châu, Cẩm Lệ
              - generic [ref=e157]:
                - generic [ref=e158]:
                  - generic [ref=e159]:
                    - heading "Cửa Hàng Cây Cảnh & Decor Bản Địa Sơn Trà" [level=4] [ref=e160]
                    - paragraph [ref=e161]: 45 Lê Tấn Trung, Sơn Trà, Đà Nẵng, Việt Nam
                  - generic [ref=e162]: ⭐ 4.7
                - generic [ref=e163]:
                  - generic [ref=e164]: 🕒 08:00 - 18:30 (Thứ 2 - Chủ Nhật)
                  - generic [ref=e165]:
                    - text: "Khu vực giao:"
                    - strong [ref=e166]: Sơn Trà, Ngũ Hành Sơn, Hải Châu
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - generic [ref=e169]:
                    - heading "Hợp Tác Xã Ươm Mầm Sinh Học Hòa Vang" [level=4] [ref=e170]
                    - paragraph [ref=e171]: Quốc lộ 14B, Hòa Vang, Đà Nẵng, Việt Nam
                  - generic [ref=e172]: ⭐ 4.8
                - generic [ref=e173]:
                  - generic [ref=e174]: 🕒 07:00 - 17:00 (Hằng ngày)
                  - generic [ref=e175]:
                    - text: "Khu vực giao:"
                    - strong [ref=e176]: Hòa Vang, Liên Chiểu, Cẩm Lệ
        - generic [ref=e177]:
          - generic [ref=e178]:
            - heading "Đơn Mua Của Tôi" [level=3] [ref=e179]:
              - img [ref=e180]
              - text: Đơn Mua Của Tôi
            - generic [ref=e183]:
              - button "Tất cả" [ref=e184] [cursor=pointer]
              - button "Chờ xử lý" [ref=e185] [cursor=pointer]
              - button "Đang giao" [ref=e186] [cursor=pointer]
              - button "Đã giao" [ref=e187] [cursor=pointer]
            - generic [ref=e189]:
              - img [ref=e191]
              - generic [ref=e194]:
                - heading "Không có đơn mua" [level=3] [ref=e195]
                - paragraph [ref=e196]: Bạn chưa có đơn đặt mua sản phẩm sinh học nào.
          - generic [ref=e197]:
            - heading "Lịch Đặt Dịch Vụ Của Tôi" [level=3] [ref=e198]:
              - img [ref=e199]
              - text: Lịch Đặt Dịch Vụ Của Tôi
            - generic [ref=e201]:
              - img [ref=e203]
              - generic [ref=e205]:
                - heading "Không có lịch hẹn" [level=3] [ref=e206]
                - paragraph [ref=e207]: Chưa có cuộc hẹn khảo sát ban công nào được đăng ký.
              - button "Tìm đặt cuộc hẹn cùng kỹ sư" [ref=e208] [cursor=pointer]
          - generic [ref=e209]:
            - heading "Lịch Sử AI Chẩn Đoán Gần Đây" [level=3] [ref=e210]:
              - img [ref=e211]
              - text: Lịch Sử AI Chẩn Đoán Gần Đây
            - generic [ref=e213]:
              - img [ref=e215]
              - generic [ref=e217]:
                - heading "Chưa có chẩn đoán" [level=3] [ref=e218]
                - paragraph [ref=e219]: Bạn chưa kiểm tra bệnh lá cây nào bằng camera AI.
              - button "Chụp ảnh chẩn đoán thử ngay" [ref=e220] [cursor=pointer]
  - contentinfo [ref=e221]:
    - generic [ref=e222]:
      - generic [ref=e223]:
        - generic [ref=e224]: GreenLife
        - paragraph [ref=e225]: Nền tảng sinh thái tích hợp AI chuyên chẩn đoán, hỗ trợ vườn nhà và kết nối cung ứng sản phẩm organic thân thiện với môi trường Việt Nam.
        - generic [ref=e226]: © 2026 GREENLIFE CORP • BẰNG SÁNG CHẾ VIỆT NAM
      - generic [ref=e227]:
        - heading "Dịch vụ cốt lõi" [level=4] [ref=e228]
        - list [ref=e229]:
          - listitem [ref=e230]:
            - button "Bác sĩ cây trồng AI (Gemini 3.5)" [ref=e231]
          - listitem [ref=e232]:
            - button "Thương mại điện tử hữu cơ" [ref=e233]
          - listitem [ref=e234]:
            - button "Danh bạ chuyên gia nông nghiệp" [ref=e235]
          - listitem [ref=e236]:
            - button "Truyền thông & Đào tạo xanh" [ref=e237]
      - generic [ref=e238]:
        - heading "Quy chuẩn cam kết" [level=4] [ref=e239]
        - list [ref=e240]:
          - listitem [ref=e241]:
            - generic [ref=e242]: "Tiêu chuẩn canh tác:"
            - text: Organic Việt Nam & Global GAP
          - listitem [ref=e243]:
            - generic [ref=e244]: "Đóng gói bền vững:"
            - text: 100% Túi tự phân hủy sinh học
          - listitem [ref=e245]:
            - generic [ref=e246]: "Lượng carbon tích lũy:"
            - text: "-750,000 kg CO2đã trung hòa"
      - generic [ref=e247]:
        - heading "Liên hệ bản địa" [level=4] [ref=e248]
        - paragraph [ref=e249]: Hợp tác xã Công nghệ xanh Hòa Lạc, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam.
        - paragraph [ref=e250]: "hotline: 1800-ECO-GREEN"
```

# Test source

```ts
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
  117 |     await expect(page.getByRole("heading", { name: /chẩn đoán/i })).toBeVisible({ timeout: 6000 });
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
> 135 |     const isRedirected = await page.getByText(/cửa hàng sinh thái|đơn mua/i).isVisible();
      |                                                                              ^ Error: locator.isVisible: Error: strict mode violation: getByText(/cửa hàng sinh thái|đơn mua/i) resolved to 2 elements:
  136 |     expect(!isSetupPage || isRedirected).toBeTruthy();
  137 |   });
  138 | });
  139 | 
```