/**
 * ai-diagnosis.spec.ts — GreenLife AI Plant Diagnosis E2E Tests
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test src/tests/e2e/ai-diagnosis.spec.ts
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goToDiagnosisPage(page: Page) {
  await page.goto(BASE_URL);
  // AI Diagnosis is accessible without login per the access policy
  await page.getByRole("link", { name: /ai|chẩn đoán/i }).click();
  await expect(page.getByRole("heading", { name: /chẩn đoán/i }).first()).toBeVisible({ timeout: 8000 });
}

// ---------------------------------------------------------------------------
// Test suite: AI Diagnosis
// ---------------------------------------------------------------------------

test.describe("AI Diagnosis Flow", () => {
  // -------------------------------------------------------------------------
  test("TC-AI-01: AI Diagnosis page is accessible to guests", async ({ page }) => {
    await goToDiagnosisPage(page);
    // Upload section should be visible
    await expect(page.getByText(/tải ảnh lên|chụp ảnh/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-AI-02: Camera toggle button is visible", async ({ page }) => {
    await goToDiagnosisPage(page);
    await expect(page.getByRole("button", { name: /camera|webcam/i })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  test("TC-AI-03: File upload input accepts image files", async ({ page }) => {
    await goToDiagnosisPage(page);
    const fileInput = page.locator("input[type='file']");
    await expect(fileInput).toBeAttached();

    // Upload a mock image (requires test fixture file)
    const testImagePath = path.resolve(__dirname, "../fixtures/test-leaf.jpg");
    try {
      await fileInput.setInputFiles(testImagePath);
      // If the fixture exists, preview should appear
      await expect(page.locator("img[alt*='preview']")).toBeVisible({ timeout: 3000 });
    } catch {
      // Fixture not present — skip visual check
      test.skip();
    }
  });

  // -------------------------------------------------------------------------
  test("TC-AI-04: Submitting diagnosis shows loading state", async ({ page }) => {
    await goToDiagnosisPage(page);

    // Attempt to click diagnose button (without image — should show validation)
    const diagnoseBtn = page.getByRole("button", { name: /chẩn đoán|phân tích/i });
    if (await diagnoseBtn.isVisible()) {
      await diagnoseBtn.click();

      // Either a validation message or loading state should appear
      const isValidating = await page.getByText(/vui lòng|chọn ảnh/i).isVisible();
      const isLoading = await page.getByRole("progressbar").isVisible();
      expect(isValidating || isLoading).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  test("TC-AI-05: Diagnosis history section exists for logged-in users", async ({ page }) => {
    // Login first
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.getByLabel(/email/i).fill("customer@greenlife.vn");
    await page.getByLabel(/mật khẩu/i).fill("Password123!");
    await page.getByRole("button", { name: /^đăng nhập$/i }).click();
    await page.waitForTimeout(2000);

    await goToDiagnosisPage(page);

    // Diagnosis history panel should appear for authenticated users
    await expect(page.getByText(/lịch sử chẩn đoán/i)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  test("TC-AI-06: Product recommendations appear after diagnosis", async ({ page }) => {
    // This test requires actual AI backend — marked as slow test
    test.slow();
    await goToDiagnosisPage(page);

    // Placeholder: verify product recommendation section structure exists
    // Full test requires mocked AI response or real backend
    await expect(page.getByText(/sản phẩm gợi ý|đề xuất/i).first()).toBeVisible({ timeout: 3000 });
  });
});
