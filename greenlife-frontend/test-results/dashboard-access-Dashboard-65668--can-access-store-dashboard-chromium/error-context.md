# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-access.spec.ts >> Dashboard Access Control (RBAC) >> TC-RBAC-05: Store owner can access store-dashboard
- Location: src\tests\e2e\dashboard-access.spec.ts:91:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/doanh thu|quản lý sản phẩm/i)
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText(/doanh thu|quản lý sản phẩm/i)

```

```yaml
- banner:
  - text: Green Life
  - paragraph: ECO-TECH LUXURY
  - text: GREEN LIFE
  - button "Vào Trang Mua Sắm"
  - text: "Vườn:"
  - strong: Thảo Mộc Đô Thị GreenLife Đà Nẵng
  - button "Đổi giao diện"
  - button "Giỏ hàng"
  - button "Thông báo"
  - 'button "Tài khoản: Cửa hàng Xanh Đà Nẵng (store)"'
  - button "Đăng xuất"
  - navigation:
    - link "Tổng Quan Kinh Doanh"
    - link "Quản Lý Đơn Hàng"
    - link "Niêm Yết Sản Phẩm"
    - link "Quản Lý Bài Viết"
    - link "Đánh Giá Khách Hàng"
    - link "Cấu hình Nhà Vườn"
  - paragraph:
    - text: "Cam kết môi trường:"
    - strong: 100%
    - text: canh tác hữu cơ bền vững Việt Nam
- main:
  - text: 1 Thông tin cơ bản 2 Địa chỉ lấy hàng 3 Vận chuyển & KYC 4 Xác nhận & Hoàn tất Đăng ký bán hàng • Bước 1 / 4
  - heading "Thông Tin Shop" [level=1]
  - paragraph: Nhập các thông tin thương hiệu, email nhận đơn hàng và xác thực OTP Gmail chính chủ.
  - text: "Tên cửa hàng / Thương hiệu xanh:"
  - 'textbox "Ví dụ: Nhà Vườn Xanh Organic Lâm Đồng"'
  - text: "Email đối tác (Dùng nhận thông báo đơn hàng & xác thực OTP):"
  - 'textbox "Ví dụ: partner@gmail.com"': store@greenlife.vn
  - button "Gửi mã OTP"
  - 'button "⚡ Bỏ qua gửi mail & dùng mã thử nghiệm (Demo OTP: 123456)"'
  - text: "Số điện thoại liên hệ của Shop:"
  - 'textbox "Ví dụ: 0905123456"'
  - button "Tiếp theo" [disabled]
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
  2   |  * dashboard-access.spec.ts — GreenLife Dashboard Role-Based Access Control E2E Tests
  3   |  *
  4   |  * Prerequisites:
  5   |  *   npm install -D @playwright/test
  6   |  *   npx playwright install
  7   |  *
  8   |  * Run:
  9   |  *   npx playwright test src/tests/e2e/dashboard-access.spec.ts
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
> 94  |     await expect(page.getByText(/doanh thu|quản lý sản phẩm/i)).toBeVisible({ timeout: 8000 });
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
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
  135 |     const isRedirected = await page.getByText(/cửa hàng sinh thái|đơn mua/i).isVisible();
  136 |     expect(!isSetupPage || isRedirected).toBeTruthy();
  137 |   });
  138 | });
  139 | 
```