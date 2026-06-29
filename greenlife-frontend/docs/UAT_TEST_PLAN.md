# GreenLife Frontend — User Acceptance Test (UAT) Plan

This document outlines the UAT test cases to verify user flows, security audits, and accessibility controls across the GreenLife platform.

---

## Test Case 1: Cart & Sandbox Checkout Flow
- **Description**: Verify adding items to the cart, modifying quantities, and completing the COD/VNPay checkout.
- **Steps**:
  1. Open the GreenLife shop page.
  2. Click **Thêm vào giỏ** on one or more products.
  3. Click the Shopping Bag icon in the header to open the **Cart Drawer**.
  4. Verify that quantities can be increased, decreased, or items can be removed.
  5. Select **Thanh toán khi nhận hàng (COD)** or **Thanh toán VNPay (Sandbox)**.
  6. Fill in the Vietnamese shipping address fields.
  7. Submit checkout and confirm success message/navigation to the provider sandbox.
- **Expected Results**:
  - Cart drawer handles close-on-Escape.
  - Buttons have descriptive `aria-label` tags.
  - Success message displays proper carbon offset credits.

---

## Test Case 2: AI Plant Disease Diagnosis Flow
- **Description**: Verify scanning plant leaves to diagnose diseases using the camera or file upload.
- **Steps**:
  1. Navigate to the **AI Diagnosis** page.
  2. Upload an image of a diseased plant leaf or capture one using the webcam feed.
  3. Wait for the AI model to process the diagnosis.
  4. Review the severity rating, treatment protocol recommendation, and taggable biopesticide recommendations.
- **Expected Results**:
  - Loader displays a skeleton screen or proper loading spinner with `aria-busy="true"`.
  - Taggable products allow direct addition to cart.

---

## Test Case 3: Expert Directory & Booking Flow
- **Description**: Verify searching for agricultural experts and booking balcony inspection surveys.
- **Steps**:
  1. Navigate to the **Expert Directory** page.
  2. Search for experts by specialty or region.
  3. Click **Đăng ký tư vấn** on an expert card.
  4. Select date, time, type (online Zoom or offline onsite), and detail description in the booking form.
  5. Submit the booking request.
- **Expected Results**:
  - Search results update instantly with proper loading state.
  - Booked appointment appears on the Customer Dashboard under "Lịch Đặt Dịch Vụ Của Tôi".

---

## Test Case 4: Security & HTML Sanitization
- **Description**: Verify that the application is secure against Cross-Site Scripting (XSS) in blog detail pages.
- **Steps**:
  1. Insert mock malicious HTML tags (e.g. `<script>alert('XSS')</script>`, `<img src=x onerror=alert(1)>`) inside blog post body content on the backend or using mock data.
  2. Navigate to the **Blog Detail** page.
  3. Verify the article page displays without executing any malicious scripts.
- **Expected Results**:
  - HTML content is sanitized using `DOMPurify` before binding to `dangerouslySetInnerHTML`.
  - Scripts and handler properties (like `onerror`) are completely removed from the DOM.
