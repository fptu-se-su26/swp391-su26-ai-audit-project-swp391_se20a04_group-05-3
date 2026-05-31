# 🌿 GreenLife - Cấu Trúc Hệ Thống Phân Tách (Frontend & Backend)

Hệ thống **GreenLife** đã được tái cấu trúc toàn diện từ một ứng dụng Monorepo nguyên khối thành **hai gói (packages) độc lập hoạt động song song**:
1.  **Frontend**: Ứng dụng giao diện React + Vite + TailwindCSS (cổng `3000`).
2.  **Backend**: Máy chủ Express + Microsoft SQL Server + Google Gemini AI (cổng `5000`).

Sự phân tách này mang lại sự bảo mật tuyệt đối cho cơ sở dữ liệu và các khoá API bảo mật phía Server, đồng thời giúp mã nguồn có tính kết dính cao (High Cohesion) và độc lập (Low Coupling).

---

## 📁 Chi Tiết Chức Năng Của Từng Thư Mục & File

Dưới đây là sơ đồ và mô tả chi tiết nhiệm vụ của từng tệp tin trong hệ thống mới:

### 1. 🗄️ Cấu Trúc Phía Máy Chủ (`backend/`)

Toàn bộ các tác vụ xử lý CSDL và tương tác AI được đóng gói riêng biệt trong thư mục `backend/`:

| Tên Tệp / Thư mục | Chức Năng / Vai Trò Trong Hệ Thống |
| :--- | :--- |
| **`server.ts`** | **API Entrypoint (Cổng vào)**: Khởi chạy Express, cấu hình middleware CORS cho phép giao diện frontend kết nối, và định tuyến (mount) các module API routing cụ thể. |
| **`db.ts`** | **Database Manager**: Quản lý Connection Pool kết nối Microsoft SQL Server, thực hiện truy vấn và tự động ghi nhận nhật ký lỗi. |
| **`src/services/gemini.ts`** | **Gemini AI Service**: Khởi tạo cấu hình và quản lý kết nối an toàn với mô hình **Gemini 3.5 Flash API**. Cô lập hoàn toàn API Key bí mật khỏi phía Client. |
| **`src/routes/ai.ts`** | **AI Routing File**: Định nghĩa API chẩn đoán bệnh lý lá cây qua ảnh tải lên (`/api/ai-diagnosis`) và chat tư vấn cùng Bác sĩ Cây trồng (`/api/ai/chat`). Tự động ghi nhận log AI xuống SQL Server. |
| **`src/routes/auth.ts`** | **Auth Router**: Cung cấp API đăng ký tài khoản (`/api/auth/register`) và đăng nhập phân quyền Khách hàng/Nhà vườn/Admin (`/api/auth/login`). |
| **`src/routes/products.ts`** | **Products Router**: Cung cấp danh mục cây xanh và phụ kiện dưỡng chất (`/api/products`), tự động chuyển đổi danh mục phù hợp với giao diện. |
| **`src/routes/orders.ts`** | **Orders Router**: Xử lý tạo hóa đơn đặt hàng trong transaction an toàn (`/api/orders`) và tải lịch sử mua sắm của từng khách hàng (`/api/orders/user/:userId`). |
| **`src/routes/articles.ts`**| **Articles Router**: Cung cấp cẩm nang hướng dẫn canh tác nông nghiệp và lối sống xanh (`/api/articles`). |
| **`src/routes/feedbacks.ts`**| **Feedback Router**: Ghi nhận ý kiến đóng góp của người dùng (`/api/feedbacks`). |
| **`src/utils/helpers.ts`**  | **Helpers**: Chứa các hàm chuyển đổi danh mục sản phẩm từ SQL Server sang dạng hiển thị chuẩn của giao diện. |
| **`package.json`** | Khai báo các thư viện chạy phía server (`express`, `mssql`, `cors`, `@google/genai`, `tsx`). |
| **`tsconfig.json`** | Cấu hình biên dịch TypeScript tối ưu cho môi trường Node.js. |

---

### 2. 🎨 Cấu Trúc Phía Giao Diện (`frontend/`)

Ứng dụng hiển thị phía người dùng được tách biệt hoàn toàn để tối ưu hoá tốc độ tải trang:

| Tên Tệp / Thư mục | Chức Năng / Vai Trò Trong Hệ Thống |
| :--- | :--- |
| **`index.html`** | Điểm neo HTML duy nhất của ứng dụng SPA (Single Page Application). |
| **`vite.config.ts`** | Cấu hình máy chủ phát triển Vite chạy ở cổng `3000`, thiết lập **Proxy** chuyển tiếp mọi request có tiền tố `/api/...` về cổng backend `5000` một cách an toàn. |
| **`src/main.tsx`** | File khởi chạy React, gắn kết ứng dụng App vào thẻ DOM chính. |
| **`src/App.tsx`** | **Viewport Switcher & Layout**: Điều phối hiển thị các màn hình dựa trên vai trò người dùng (Khách hàng, Đối tác Nhà vườn, Admin). |
| **`src/index.css`** | **Design System**: Hệ thống thiết kế chuẩn của GreenLife, định nghĩa palette màu sinh thái (nâu ấm, xanh ngọc bích), phong cách kính mờ (glassmorphism) và hiệu ứng chuyển động mượt mà. |
| **`src/types.ts`** | Định nghĩa các cấu trúc kiểu TypeScript dùng chung ở frontend. |
| **`src/data.ts`** | Chứa dữ liệu giả lập dự phòng chất lượng cao đề phòng CSDL SQL Server mất kết nối đột xuất. |
| **`src/components/views/`**| **Màn Hình Giao Diện Độc Lập**: Gồm 11 view riêng biệt cho từng trang như `AIDiagnosisView.tsx`, `AdminDashboardView.tsx`, `StoreDashboardView.tsx`, v.v. |
| **`src/services/`** | **Decoupled API Client Services**: Chứa các hàm giao tiếp HTTP (gọi fetch/axios) gửi yêu cầu lên Backend như `aiDiagnosisService.ts`, `authService.ts`. |

---

## ⚡ Hướng Dẫn Vận Hành Hệ Thống

Để chạy toàn bộ hệ thống sau khi đã chia tách, bạn chỉ cần thực hiện 2 bước đơn giản sau:

### Bước 1: Cài đặt thư viện (Dependencies)
Mở cửa sổ dòng lệnh và chạy lệnh cài đặt riêng cho từng thư mục:
```bash
# Cài đặt cho Backend
cd greenlife/backend
npm install

# Cài đặt cho Frontend
cd ../frontend
npm install
```

### Bước 2: Chạy song song cả hai Package
Mở **2 cửa sổ Terminal độc lập** để chạy song song:

*   **Terminal 1 (Backend API Server):**
    ```bash
    cd greenlife/backend
    npm run dev
    ```
    *API Server sẽ khởi chạy tại: `http://localhost:5000`*

*   **Terminal 2 (Frontend Client):**
    ```bash
    cd greenlife/frontend
    npm run dev
    ```
    *Giao diện React sẽ khởi chạy tại: `http://localhost:3000`*
