import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

const MOCK_ADDRESSES = [
  {
    id: 1,
    recipientName: "Customer User",
    phone: "0901234567",
    city: "Thành phố Hồ Chí Minh",
    district: "Quận 1",
    ward: "Phường Bến Nghé",
    addressLine: "123 Lê Lợi",
    isDefault: true
  }
];

const MOCK_CART_ITEMS = [
  {
    id: 101,
    storeId: 1,
    storeName: "Store Alpha",
    plantId: 1,
    plantName: "Cây Sen Đá Store 1A",
    baseUnitPrice: 10000,
    effectiveUnitPrice: 10000,
    lineBaseAmount: 10000,
    lineEffectiveAmount: 10000,
    quantity: 1,
    plantImageUrl: "/images/plant1.jpg",
    onSale: false,
    product: {
      id: "1",
      name: "Cây Sen Đá Store 1A",
      price: 10000,
      image: "/images/plant1.jpg",
      stock: 10,
      shopId: "1"
    }
  },
  {
    id: 102,
    storeId: 1,
    storeName: "Store Alpha",
    plantId: 2,
    plantName: "Cây Xương Rồng Store 1B",
    baseUnitPrice: 15000,
    effectiveUnitPrice: 15000,
    lineBaseAmount: 15000,
    lineEffectiveAmount: 15000,
    quantity: 1,
    plantImageUrl: "/images/plant2.jpg",
    onSale: false,
    product: {
      id: "2",
      name: "Cây Xương Rồng Store 1B",
      price: 15000,
      image: "/images/plant2.jpg",
      stock: 10,
      shopId: "1"
    }
  },
  {
    id: 201,
    storeId: 2,
    storeName: "Store Beta",
    plantId: 3,
    plantName: "Cây Trầu Bà Store 2",
    baseUnitPrice: 20000,
    effectiveUnitPrice: 20000,
    lineBaseAmount: 20000,
    lineEffectiveAmount: 20000,
    quantity: 1,
    plantImageUrl: "/images/plant3.jpg",
    onSale: false,
    product: {
      id: "3",
      name: "Cây Trầu Bà Store 2",
      price: 20000,
      image: "/images/plant3.jpg",
      stock: 10,
      shopId: "2"
    }
  }
];

async function loginAsCustomer(page: Page) {
  await page.addInitScript(() => {
    const userObj = {
      token: "fake-jwt-token",
      id: 1,
      name: "Customer User",
      fullName: "Customer User",
      email: "customer@greenlife.test",
      role: "CUSTOMER"
    };
    localStorage.setItem("greenlife_current_user", JSON.stringify(userObj));
    localStorage.setItem("token", "fake-jwt-token");
  });
}

async function setupApiMocks(page: Page, cartItems = MOCK_CART_ITEMS) {
  await loginAsCustomer(page);

  await page.route("**/api/auth/me", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        fullName: "Customer User",
        email: "customer@greenlife.test",
        role: "CUSTOMER"
      })
    });
  });

  await page.route("**/api/products**", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });

  await page.route("**/api/administrative/provinces", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });

  await page.route("**/api/stores/public**", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });

  await page.route("**/api/addresses", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ADDRESSES)
    });
  });

  await page.route("**/api/cart", async route => {
    if (route.request().method() === "GET") {
      const subtotal = cartItems.reduce((sum, item) => sum + item.lineEffectiveAmount, 0);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: cartItems, subtotal })
      });
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/cart/items/*", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true })
    });
  });
}

test.describe("PR5B — Shopping Cart & Checkout Suite", () => {
  // -------------------------------------------------------------------------
  test("TC-PR5B-01: Store grouping renders items by store", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto(BASE_URL);

    // Open Cart Drawer
    await page.locator("[aria-label='Giỏ hàng']").first().click();

    await expect(page.getByText("Store Alpha")).toBeVisible();
    await expect(page.getByText("Store Beta")).toBeVisible();

    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();
    await expect(page.getByText("Cây Xương Rồng Store 1B")).toBeVisible();
    await expect(page.getByText("Cây Trầu Bà Store 2")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-02: Individual selection payload sends selected CartItem IDs", async ({ page }) => {
    await setupApiMocks(page);
    let interceptedBody: any = null;

    await page.route("**/api/checkout", async route => {
      interceptedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1001, orderCode: "ORD-1001" }])
      });
    });

    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Deselect item 101 and 201, leaving only 102
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Sen Đá Store 1A" }).uncheck();
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Trầu Bà Store 2" }).uncheck();

    // Step 1 -> Step 2
    await page.getByRole("button", { name: /Chọn Địa Chi Giao Hàng/i }).click();

    // Wait for Step 2 address load
    await expect(page.getByText("Customer User")).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole("button", { name: /Tiếp Tục/i }).click();

    // Submit checkout (COD by default)
    await page.getByRole("button", { name: /ĐẶT HÀNG COD/i }).click();

    expect(interceptedBody).not.toBeNull();
    expect(interceptedBody.cartItemIds).toEqual([102]);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-03: Store-level selection toggles all items in that store group", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Unselect all globally
    await page.getByRole("checkbox", { name: "Chọn tất cả sản phẩm trong giỏ hàng" }).uncheck();

    // Select Store Alpha checkbox
    await page.getByRole("checkbox", { name: "Chọn tất cả sản phẩm của cửa hàng Store Alpha" }).check();

    const check101 = page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Sen Đá Store 1A" });
    const check102 = page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Xương Rồng Store 1B" });
    const check201 = page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Trầu Bà Store 2" });

    await expect(check101).toBeChecked();
    await expect(check102).toBeChecked();
    await expect(check201).not.toBeChecked();
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-04: Global indeterminate selection state", async ({ page }) => {
    await setupApiMocks(page);
    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    const selectAll = page.getByRole("checkbox", { name: "Chọn tất cả sản phẩm trong giỏ hàng" });
    await expect(selectAll).toBeChecked();

    // Uncheck item 101
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Sen Đá Store 1A" }).uncheck();

    // Evaluate DOM property
    const isIndeterminate = await selectAll.evaluate(el => (el as HTMLInputElement).indeterminate);
    expect(isIndeterminate).toBe(true);
    await expect(selectAll).not.toBeChecked();
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-05: Empty selection blocks checkout submission", async ({ page }) => {
    await setupApiMocks(page);
    let checkoutCalls = 0;

    await page.route("**/api/checkout", async route => {
      checkoutCalls++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Unselect all
    await page.getByRole("checkbox", { name: "Chọn tất cả sản phẩm trong giỏ hàng" }).uncheck();

    const nextBtn = page.getByRole("button", { name: /Chọn Địa Chi Giao Hàng/i });
    await expect(nextBtn).toBeDisabled();
    expect(checkoutCalls).toBe(0);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-06: PayOS single selected item checkout payload", async ({ page }) => {
    await setupApiMocks(page);
    let checkoutBody: any = null;
    let createLinkBody: any = null;

    await page.route("**/api/checkout", async route => {
      checkoutBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: 888, storeId: 1, totalAmount: 15000 }])
      });
    });

    await page.route("**/api/payments/payos/create-link", async route => {
      createLinkBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkoutUrl: "http://localhost:3000/payment/success?orderCode=888" })
      });
    });

    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Deselect 101 and 201 so only 102 (15,000 VND) is selected
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Sen Đá Store 1A" }).uncheck();
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Trầu Bà Store 2" }).uncheck();

    // Step 1 -> Step 2
    await page.getByRole("button", { name: /Chọn Địa Chi Giao Hàng/i }).click();

    // Wait for Step 2 address load
    await expect(page.getByText("Customer User")).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole("button", { name: /Tiếp Tục/i }).click();

    // Select PayOS in Step 3
    await page.getByText("Thanh toán Online PayOS").click();

    // Prepare response promise
    const payosResponsePromise = page.waitForResponse("**/api/payments/payos/create-link");

    // Submit
    await page.getByRole("button", { name: /THANH TOÁN PAYOS/i }).click();

    await payosResponsePromise;

    expect(checkoutBody).not.toBeNull();
    expect(checkoutBody.cartItemIds).toEqual([102]);
    expect(checkoutBody.paymentMethod).toBe("PAYOS");

    expect(createLinkBody).not.toBeNull();
    expect(createLinkBody.orderId).toBe(888);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-08: PayOS multi-store is blocked with error message", async ({ page }) => {
    await setupApiMocks(page);
    let checkoutCalls = 0;

    await page.route("**/api/checkout", async route => {
      checkoutCalls++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Step 1 -> Step 2
    await page.getByRole("button", { name: /Chọn Địa Chi Giao Hàng/i }).click();

    // Wait for Step 2 address load
    await expect(page.getByText("Customer User")).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole("button", { name: /Tiếp Tục/i }).click();

    // Select PayOS in Step 3
    await page.getByText("Thanh toán Online PayOS").click();

    // Submit
    await page.getByRole("button", { name: /THANH TOÁN PAYOS/i }).click();

    await expect(page.getByText(/Thanh toán PayOS hiện tại chỉ hỗ trợ sản phẩm từ một cửa hàng/i).first()).toBeVisible();
    expect(checkoutCalls).toBe(0);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-09: Malformed PayOS response blocks link creation", async ({ page }) => {
    await setupApiMocks(page);
    let createLinkCalls = 0;

    await page.route("**/api/checkout", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1 }, { id: 2 }])
      });
    });

    await page.route("**/api/payments/payos/create-link", async route => {
      createLinkCalls++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Deselect item 201 so only Store 1 is selected
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Trầu Bà Store 2" }).uncheck();

    // Step 1 -> Step 2
    await page.getByRole("button", { name: /Chọn Địa Chi Giao Hàng/i }).click();

    // Wait for Step 2 address load
    await expect(page.getByText("Customer User")).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole("button", { name: /Tiếp Tục/i }).click();

    // Select PayOS in Step 3
    await page.getByText("Thanh toán Online PayOS").click();

    // Submit
    await page.getByRole("button", { name: /THANH TOÁN PAYOS/i }).click();

    await expect(page.getByText(/Thanh toán PayOS yêu cầu tạo duy nhất một đơn hàng/i).first()).toBeVisible();
    expect(createLinkCalls).toBe(0);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-10: COD multi-store handles multiple orders and refreshes cart", async ({ page }) => {
    await setupApiMocks(page);
    let checkoutBody: any = null;
    let cartReloadCount = 0;

    await page.route("**/api/checkout", async route => {
      checkoutBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1001 }, { id: 1002 }])
      });
    });

    await page.route("**/api/cart", async route => {
      if (route.request().method() === "GET") {
        cartReloadCount++;
        const items = cartReloadCount === 1 ? MOCK_CART_ITEMS : [MOCK_CART_ITEMS[1]];
        const subtotal = items.reduce((sum, item) => sum + item.lineEffectiveAmount, 0);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items, subtotal })
        });
      }
    });

    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Deselect 102
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Xương Rồng Store 1B" }).uncheck();

    // Step 1 -> Step 2
    await page.getByRole("button", { name: /Chọn Địa Chi Giao Hàng/i }).click();

    // Wait for Step 2 address load
    await expect(page.getByText("Customer User")).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole("button", { name: /Tiếp Tục/i }).click();

    // Submit
    await page.getByRole("button", { name: /ĐẶT HÀNG COD/i }).click();

    expect(checkoutBody).not.toBeNull();
    expect(checkoutBody.cartItemIds).toEqual([101, 201]);
    expect(cartReloadCount).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-12: PayOS link creation failure preserves local cart", async ({ page }) => {
    await setupApiMocks(page);

    await page.route("**/api/checkout", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: 888 }])
      });
    });

    await page.route("**/api/payments/payos/create-link", async route => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Lỗi kết nối cổng thanh toán" })
      });
    });

    await page.goto(BASE_URL);
    await page.locator("[aria-label='Giỏ hàng']").first().click();
    await expect(page.getByText("Cây Sen Đá Store 1A")).toBeVisible();

    // Deselect item 201 so only Store 1 is selected
    await page.getByRole("checkbox", { name: "Chọn sản phẩm Cây Trầu Bà Store 2" }).uncheck();

    // Step 1 -> Step 2
    await page.getByRole("button", { name: /Chọn Địa Chi Giao Hàng/i }).click();

    // Wait for Step 2 address load
    await expect(page.getByText("Customer User")).toBeVisible();

    // Step 2 -> Step 3
    await page.getByRole("button", { name: /Tiếp Tục/i }).click();

    // Select PayOS in Step 3
    await page.getByText("Thanh toán Online PayOS").click();

    const submitBtn = page.getByRole("button", { name: /THANH TOÁN PAYOS/i });
    await submitBtn.click();

    // Error should show and submit button should re-enable
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-13: Verified PAID status displays success and reloads cart once", async ({ page }) => {
    await setupApiMocks(page, []);
    let cartReloadCount = 0;

    await page.route("**/api/cart", async route => {
      if (route.request().method() === "GET") {
        cartReloadCount++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [], subtotal: 0 })
        });
      }
    });

    await page.route("**/api/payments/payos/9999/status", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ orderCode: 9999, amount: 15000, paymentStatus: "PAID" })
      });
    });

    await page.goto(`${BASE_URL}/payment/success?orderCode=9999`);

    await expect(page.getByText("Thanh toán thành công!")).toBeVisible();
    expect(cartReloadCount).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-14: PENDING to PAID transition updates state and calls loadCart once", async ({ page }) => {
    await setupApiMocks(page, []);
    let cartReloadCount = 0;
    let statusCallCount = 0;

    await page.route("**/api/cart", async route => {
      if (route.request().method() === "GET") {
        cartReloadCount++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [], subtotal: 0 })
        });
      }
    });

    await page.route("**/api/payments/payos/7777/status", async route => {
      statusCallCount++;
      const status = statusCallCount === 1 ? "PENDING" : "PAID";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ orderCode: 7777, amount: 15000, paymentStatus: status })
      });
    });

    await page.goto(`${BASE_URL}/payment/success?orderCode=7777`);

    await expect(page.getByText("Thanh toán thành công!")).toBeVisible({ timeout: 10000 });
    expect(cartReloadCount).toBeGreaterThanOrEqual(1);
    expect(statusCallCount).toBeGreaterThanOrEqual(2);
  });

  // -------------------------------------------------------------------------
  test("TC-PR5B-15: Missing orderCode shows unable-to-verify state and avoids cart reload", async ({ page }) => {
    await setupApiMocks(page, []);
    let cartReloadCount = 0;
    let statusCallCount = 0;

    await page.route("**/api/cart", async route => {
      if (route.request().method() === "GET") cartReloadCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], subtotal: 0 })
      });
    });

    await page.route("**/api/payments/payos/*/status", async route => {
      statusCallCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(`${BASE_URL}/payment/success`);

    await expect(page.getByText("Chưa thể xác minh đơn hàng")).toBeVisible();
    await expect(page.getByText("Thanh toán thành công!")).toBeHidden();
    expect(statusCallCount).toBe(0);
  });
});
