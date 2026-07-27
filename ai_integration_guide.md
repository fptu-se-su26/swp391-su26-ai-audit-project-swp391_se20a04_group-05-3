# 📘 TÀI LIỆU TỔNG HỢP KIẾN TRÚC & HƯỚNG DẪN TÍCH HỢP AI
**(Dành cho Đội ngũ Phát triển & Deploy Web)**

Tài liệu này tổng hợp **toàn bộ mã nguồn, kiến trúc dữ liệu, API contract và quy trình triển khai** cho 2 tính năng AI trên hệ thống GreenLife:
1. **Bác Sĩ Cây AI (AI Plant Doctor)**: Phân tích hình ảnh lá cây bị bệnh + mô tả của người dùng để chẩn đoán nguyên nhân, mức độ bệnh, hướng điều trị và đề xuất sản phẩm/dịch vụ phù hợp.
2. **Chatbot Trợ Lý GreenLife (AI Web Assistant)**: Trợ lý ảo tư vấn kiến thức làm vườn, hướng dẫn sử dụng website và đề xuất các lối tắt điều hướng (Suggested Actions).

---

## 🛠️ 1. CẤU HÌNH MÔI TRƯỜNG & CHẤT LIỆU AI (PREREQUISITES)

### A. Nhà cung cấp AI (AI Provider)
- **Model**: `gemini-flash-latest` (hoặc `gemini-1.5-flash`) từ **Google Generative AI (Gemini API)**.
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`
- **Authentication**: Header `x-goog-api-key: {YOUR_GEMINI_API_KEY}`.

### B. Biến môi trường Backend (`.env` / `application.properties`)
```properties
# Kích hoạt tính năng AI
AI_ENABLED=true

# API Key lấy từ Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>

# Tên mô hình sử dụng
GEMINI_MODEL=gemini-flash-latest

# Thời gian chờ tối đa (timeout) cho request AI
AI_REQUEST_TIMEOUT_SECONDS=60
```

---

## 🗄️ 2. CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Cơ sở dữ liệu lưu trữ lịch sử chẩn đoán bệnh cây (`diagnosis_history`) trong SQL Server:

```sql
CREATE TABLE diagnosis_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,                          -- ID người dùng (FK users)
    plant_id INT NULL,                                 -- ID cây cảnh nếu gắn với cây có sẵn
    image_url NVARCHAR(500) NOT NULL,                  -- Đường dẫn ảnh trên máy chủ/S3
    disease_name NVARCHAR(150) NULL,                   -- Tên bệnh hại do AI phát hiện
    confidenceScore DECIMAL(5,2) NULL,                 -- Độ tin cậy (%) 0 - 100
    severity NVARCHAR(30) NULL,                        -- Mức độ: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    result NVARCHAR(MAX) NULL,                         -- Tổng quan triệu chứng quan sát được
    recommendation NVARCHAR(MAX) NULL,                 -- Khuyên dùng / giải pháp ban đầu
    plant_name NVARCHAR(150) NULL,                     -- Tên loại cây cảnh nhận diện được
    provider NVARCHAR(50) DEFAULT 'GEMINI',            -- Đơn vị AI ('GEMINI')
    model NVARCHAR(100) DEFAULT 'gemini-flash-latest', -- Tên model
    processing_status NVARCHAR(50) DEFAULT 'COMPLETED',-- Trạng thái xử lý
    observed_symptoms NVARCHAR(MAX) NULL,              -- Chi tiết triệu chứng
    possible_causes NVARCHAR(MAX) NULL,                -- Chi tiết nguyên nhân
    alternative_diagnoses NVARCHAR(MAX) NULL,          -- JSON mảng các chẩn đoán thay thế
    treatment_steps NVARCHAR(MAX) NULL,                -- JSON mảng các bước điều trị
    prevention_steps NVARCHAR(MAX) NULL,               -- JSON mảng các bước phòng ngừa
    urgent_warning NVARCHAR(MAX) NULL,                 -- Cảnh báo khẩn cấp (nếu có)
    disclaimer NVARCHAR(MAX) NULL,                     -- Tuyên bố miễn trừ trách nhiệm
    diagnosable BIT DEFAULT 1,                         -- 1: Chẩn đoán được, 0: Ảnh không rõ
    uncertainty_reason NVARCHAR(MAX) NULL,             -- Lý do không chẩn đoán được
    expert_review_recommended BIT DEFAULT 0,          -- Đề xuất kiểm tra trực tiếp
    escalation_reason NVARCHAR(50) NULL,               -- Mã lý do đề xuất chuyên gia
    recommendation_categories NVARCHAR(MAX) NULL,      -- Danh mục đề xuất sản phẩm/dịch vụ
    user_context NVARCHAR(500) NULL,                   -- Mô tả thêm từ người dùng
    created_at DATETIME2 DEFAULT GETDATE() NOT NULL,   -- Ngày tạo
    deleted BIT DEFAULT 0 NOT NULL,                    -- Soft delete
    CONSTRAINT FK_diagnosis_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- Index tăng tốc truy vấn lịch sử
CREATE INDEX IX_diagnosis_customer_created ON diagnosis_history(customer_id, created_at DESC);
```

---

## ⚙️ 3. BACKEND SOURCE CODE (JAVA / SPRING BOOT)

### A. Các class thuộc Tính năng "Bác Sĩ Cây AI":
1. **[GeminiProviderService.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src/main/java/com/greenlife/ai/service/GeminiProviderService.java)**
   - Thực hiện mã hóa ảnh dạng Base64 (`inlineData`).
   - Xây dựng **System Instruction** yêu cầu Gemini trả về định dạng **JSON ngặt nghèo** (bao gồm tên bệnh, triệu chứng, mức độ, các bước điều trị, và danh mục đề xuất).
   - Ghép thêm thông tin `userContext` nếu người dùng nhập mô tả:
     > *"Thông tin người trồng cung cấp: {userContext}. Hãy ưu tiên đối chiếu thông tin này với hình ảnh..."*
2. **[GeminiPlantDiseaseClassifier.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src/main/java/com/greenlife/diagnosis/service/GeminiPlantDiseaseClassifier.java)**
   - Kiểm tra **Magic Bytes** của ảnh (PNG, JPEG, WebP) chống tải file độc hại.
   - Kiểm tra tính nhất quán giữa đuôi file và định dạng ảnh thực tế.
3. **[DiagnosisService.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src\main\java\com\greenlife\diagnosis\service\DiagnosisService.java)**
   - Kiểm tra **Rate Limit ngày** (Tối đa 20 lượt chẩn đoán/ngày/user).
   - Kiểm tra **Quota kho lưu trữ** (Tối đa 200 ảnh/user).
   - Lưu trữ ảnh vào đĩa/cloud storage và lưu bản ghi vào DB.
4. **[DiagnosisController.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src\main\java\com\greenlife\diagnosis\controller\DiagnosisController.java)**
   - `POST /api/diagnoses`: Nhận multipart file (`file`), `plantId` (tùy chọn) và `userContext` (tùy chọn String).

---

### B. Các class thuộc Tính năng "Chatbot Trợ Lý GreenLife":
1. **[ChatService.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src\main\java\com\greenlife\chat\service\ChatService.java)**
   - Kiểm tra độ dài câu hỏi (1..1000 ký tự).
   - Thiết lập **System Prompt** cho Chatbot:
     - Giới hạn vai trò: Chỉ tư vấn về làm vườn, chăm sóc cây cảnh và hướng dẫn tính năng trang web.
     - Quy định cách xuống dòng `1.`, `2.`, `3.` mạch lạc.
     - Định nghĩa mảng danh mục điều hướng hợp lệ (`suggestedActionIds`).
2. **[WebsiteAction.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src\main\java\com\greenlife\chat\catalog\WebsiteAction.java)**
   - Enum định nghĩa danh sách nút lối tắt chuẩn trên web:
     - `nav_home`: Về Trang Chủ (`/`)
     - `nav_shop`: Đến Cửa Hàng Cây (`/shop`)
     - `nav_ai_diagnosis`: Dùng Bác Sĩ Cây AI (`/ai-diagnosis`)
     - `nav_booking`: Đặt Dịch Vụ Chăm Sóc Cây (`/booking`)
     - `nav_blog`: Đọc Cẩm Nang Xanh (`/blog`)
3. **[ChatRateLimiter.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src\main\java\com\greenlife\chat\service\ChatRateLimiter.java)**
   - Chống spam chat (Tối đa 20 request/60 giây per IP/User).
4. **[ChatController.java](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-backend/src\main\java\com\greenlife\chat\controller\ChatController.java)**
   - `POST /api/ai/chat`: Nhận body `{ question: "...", currentRoute: "home" }`.

---

## 🎨 4. FRONTEND SOURCE CODE (REACT / TYPESCRIPT)

### A. Tích hợp API Services:
1. **[aiDiagnosisService.ts](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-frontend/src\services\aiDiagnosisService.ts)**:
   ```typescript
   // Gọi API chẩn đoán ảnh + mô tả
   public static async diagnosePlantLeaf(file: File | Blob, userContext?: string): Promise<DiagnosisLog> {
     const formData = new FormData();
     formData.append("file", file);
     if (userContext && userContext.trim()) {
       formData.append("userContext", userContext.trim());
     }
     const data = await HttpClient.post("/api/diagnoses", formData);
     return this.mapBackendToDiagnosisLog(data);
   }
   ```
2. **[useDiagnosis.ts](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-frontend/src\hooks\useDiagnosis.ts)**:
   - Hook React quản lý state `userContext`, `isDiagnosing`, `diagnose`.

---

### B. Component Giao Diện (UI Components):
1. **[AIDiagnosisView.tsx](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-frontend/src\components\views\AIDiagnosisView.tsx)**:
   - **Vùng Upload ảnh**: Kéo thả / Chọn ảnh PNG, JPG.
   - **Khung Textarea mô tả**: Đặt dưới vùng xem ảnh, giới hạn 500 ký tự với bộ đếm `{userContext.length}/500`.
   - **Báo cáo kết quả chẩn đoán**:
     - Hiển thị mức độ bệnh (Badge Severity `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
     - Cảnh báo khẩn cấp (`urgentWarning`).
     - Chi tiết triệu chứng, nguyên nhân, các bước điều trị (`treatmentSteps`), phòng ngừa.
     - Đề xuất sản phẩm/dịch vụ (`recommendedProducts`, `recommendedServices`).
     - Hiển thị lại mô tả do người dùng cung cấp (`userContext`).

2. **[Chatbot.tsx](file:///d:/SU26/SWP/swp391-su26-ai-audit-project-swp391_se20a04_group-05-3-main/greenlife-frontend/src\components\ui\Chatbot.tsx)**:
   - Widget chat nổi ở góc dưới phải màn hình.
   - **Bộ xử lý format văn bản (`formatBotText`)**:
     - Tự động tách các mục `1.`, `2.`, `3.`... thành các dòng riêng biệt.
     - Khoảng cách các mục được căn chỉnh nhỏ gọn nửa dòng (`mt-1 mb-0.5`).
   - **Các nút lối tắt nhanh**: Cho phép người dùng bấm "Cửa hàng cây", "Bác Sĩ Cây AI", "Đặt dịch vụ" để chuyển trang tức thì.

---

## 🚀 5. QUY TRÌNH DEPLOY & TÍCH HỢP CHO DỰ ÁN KHÁC

Để dự án đối tác có thể deploy và tích hợp dễ dàng:

### Bước 1: Khởi tạo CSDL
Chạy file SQL migration trong thư mục `database/patches/`:
1. `patch_21_ai_production_foundation.sql` (Tạo bảng `diagnosis_history`)
2. `patch_25_add_user_context.sql` (Thêm cột `user_context`)

### Bước 2: Cấu hình Backend Environment
Thêm các giá trị sau vào file `.env` trên Server Backend:
```env
AI_ENABLED=true
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-flash-latest
```

### Bước 3: Build & Deploy Backend
Sử dụng Maven để đóng gói file `.jar`:
```bash
./mvnw clean package -DskipTests
java -jar target/greenlife-backend-0.0.1-SNAPSHOT.jar
```

### Bước 4: Deploy Frontend
1. Cấu hình proxy / API endpoint trỏ tới Backend API (`/api/ai/chat` và `/api/diagnoses`).
2. Build ứng dụng React / Next.js:
```bash
npm run build
```
3. Deploy kết quả lên Vercel / Nginx / Docker.
