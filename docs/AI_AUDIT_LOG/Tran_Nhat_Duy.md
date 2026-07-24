# BÁO CÁO CHI TIẾT NHẬT KÝ SỬ DỤNG AI TRONG DỰ ÁN GREENLIFE

> **Dự án**: GreenLife - AI Audit Project (SWP391)
> **Mục tiêu**: Báo cáo lưu trữ lịch sử sử dụng AI hỗ trợ phân tích yêu cầu, thiết kế giao diện, lập trình backend/frontend, kiểm thử tự động và quản trị cơ sở dữ liệu.

---

## 4. Nhật ký sử dụng AI chi tiết

> Mỗi lần sử dụng AI cho một phần quan trọng của bài tập/project, sinh viên cần ghi lại theo mẫu bên dưới.
> Sinh viên/nhóm có thể nhân bản mẫu “Lần sử dụng AI” nhiều lần tùy theo số lần sử dụng AI thực tế.


---

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Khởi tạo và thiết lập cấu trúc thư mục dự án giao diện Next.js, chuyển đổi từ Vite sang Next.js để tối ưu hóa SEO và quản lý các package dependencies (tsconfig.json, package.json, next.config.js). |
| Phần việc liên quan | Frontend / Design / Requirement |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.1.1. Prompt đã sử dụng

```text
Hãy giúp tôi cấu trúc và chuyển đổi dự án giao diện GreenLife từ Vite sang Next.js để tối ưu hóa SEO và hiệu năng. Thiết lập các cấu hình tệp tsconfig.json và package.json để chuẩn bị cho việc xây dựng các thành phần UI.
```

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Phát triển và hoàn thiện giao diện Trang chủ (HomeView.tsx) và Trang mua sắm (ShopView.tsx) với thiết kế hiện đại, responsive, tích hợp các bộ lọc tìm kiếm sản phẩm và hiển thị thông tin cửa hàng. |
| Phần việc liên quan | Frontend / Design |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.2.1. Prompt đã sử dụng

```text
Hãy viết mã nguồn cho trang chủ HomeView.tsx hiển thị slide banner và danh mục sản phẩm nổi bật, kết hợp trang ShopView.tsx hiển thị danh sách sản phẩm cây xanh với các bộ lọc theo giá và loại cây.
```

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Tích hợp thành phần Chatbot thông minh hỗ trợ tư vấn trực tuyến (Chatbot.tsx) trên giao diện người dùng, hỗ trợ người dùng trò chuyện nhanh về các vấn đề cây cảnh. |
| Phần việc liên quan | Frontend / Design |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.3.1. Prompt đã sử dụng

```text
Tạo thành phần Chatbot.tsx dạng bong bóng nổi ở góc dưới bên phải màn hình, hỗ trợ mở rộng khung chat, nhập tin nhắn và hiển thị lịch sử trò chuyện giả lập tư vấn viên chăm sóc cây xanh.
```

---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Thiết kế và triển khai giao diện chi tiết sản phẩm (ProductDetailView.tsx) và khung chẩn đoán bệnh cây bằng AI (AIDiagnosisView.tsx) để người dùng gửi ảnh cây bệnh lên phân tích. |
| Phần việc liên quan | Frontend / Design / Requirement |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.4.1. Prompt đã sử dụng

```text
Hãy viết thành phần giao diện AIDiagnosisView.tsx tích hợp cùng dịch vụ AI chẩn đoán bệnh cho cây trồng, hiển thị kết quả chẩn đoán và đề xuất cách chăm sóc tương ứng. Đồng thời thiết kế ProductDetailView.tsx hiển thị ảnh sản phẩm lớn và thông tin mô tả chi tiết.
```

---

### Lần sử dụng AI số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Viết schema cơ sở dữ liệu ban đầu cho dự án (greenlife.sql) thiết lập các bảng người dùng (users), cửa hàng (stores), sản phẩm (products) và mối quan hệ giữa chúng. |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.5.1. Prompt đã sử dụng

```text
Hãy thiết kế cấu trúc database ban đầu lưu trong tệp SQL greenlife.sql bao gồm các bảng users, stores, products, bookings cùng các khóa ngoại và ràng buộc dữ liệu cơ bản.
```

---

### Lần sử dụng AI số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 05/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Tích hợp và đẩy mã nguồn GreenLife Frontend lên GitHub lần đầu tiên, dọn dẹp các tệp cấu hình thừa và thiết lập các biến môi trường cấu hình API endpoint. |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.6.1. Prompt đã sử dụng

```text
Tôi cần đẩy code frontend hiện tại lên repository GitHub. Hãy dọn dẹp các thư mục build tạm thời và cấu hình file .gitignore để giữ repository sạch sẽ.
```

---

### Lần sử dụng AI số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Khởi tạo khung dự án Spring Boot Backend (greenlife-backend), cấu hình quản lý dependencies Maven (pom.xml), cấu hình bảo mật JWT và cơ sở dữ liệu (SecurityConfig.java, JwtService.java, application.properties). |
| Phần việc liên quan | Backend / Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.7.1. Prompt đã sử dụng

```text
Tôi cần tạo khung dự án Spring Boot cho GreenLife Backend. Hãy thiết lập các cấu hình tệp pom.xml cho Maven, cấu hình lớp SecurityConfig.java cho Spring Security và JwtService.java để xử lý mã hóa JWT Token bảo mật API.
```

---

### Lần sử dụng AI số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Thiết lập Entity và Repository cho các thực thể người dùng, vai trò và cửa hàng (User.java, Role.java, Store.java và các interface UserRepository, RoleRepository, StoreRepository tương ứng). |
| Phần việc liên quan | Backend / Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.8.1. Prompt đã sử dụng

```text
Hãy tạo các thực thể Java Spring Boot (Entities) ánh xạ sang database cho bảng users, roles và stores sử dụng JPA. Thiết lập các repositories tương ứng kế thừa JpaRepository để thao tác dữ liệu.
```

---

### Lần sử dụng AI số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Xây dựng Controller và Service cho hệ thống đăng ký, đăng nhập và lấy mã xác thực OTP (AuthController.java, AuthService.java) hỗ trợ gửi nhận mã OTP. |
| Phần việc liên quan | Backend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.9.1. Prompt đã sử dụng

```text
Xây dựng dịch vụ AuthService.java và AuthController.java để xử lý đăng nhập, đăng ký tài khoản mới và gửi mã xác thực OTP qua email của người dùng.
```

---

### Lần sử dụng AI số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 15/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Viết script Node.js kiểm thử tự động (test_auth.js) để kiểm tra toàn diện API Đăng ký -> Nhận OTP -> Xác thực OTP -> Đăng nhập của backend xem có hoạt động đúng logic hay không. |
| Phần việc liên quan | Testing / Backend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.10.1. Prompt đã sử dụng

```text
Hãy viết một script Node.js (test_auth.js) tự động gửi request đến backend để kiểm tra luồng đăng ký tài khoản mới, gửi OTP, xác thực OTP thành công, và đăng nhập để nhận JWT Token nhằm kiểm tra hiệu năng và tính đúng đắn của API.
```

---

### Lần sử dụng AI số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Loại bỏ tab Đặt lịch khám (BookingView.tsx) không cần thiết khỏi hệ thống theo yêu cầu nghiệp vụ mới và cập nhật Admin Dashboard (AdminDashboardView.tsx) hiển thị trực quan các thẻ doanh thu và người dùng. |
| Phần việc liên quan | Frontend / Design |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.11.1. Prompt đã sử dụng

```text
Hãy xóa tab đặt lịch (Bookings) trong giao diện AdminDashboardView.tsx của Admin, đồng thời sắp xếp lại layout và các thẻ thống kê doanh thu, người dùng, cửa hàng sao cho cân đối và trực quan hơn.
```

---

### Lần sử dụng AI số 12

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Phát triển trang Danh sách Chuyên gia (ExpertDirectoryView.tsx) và thiết lập cấu hình hồ sơ cửa hàng (StoreProfileSetupView.tsx) cho phép chủ cửa hàng cập nhật thông tin cửa hàng. |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.12.1. Prompt đã sử dụng

```text
Hãy viết mã nguồn cho StoreProfileSetupView.tsx hỗ trợ thiết lập hồ sơ cửa hàng, lựa chọn vị trí địa lý trên bản đồ giả lập (MockMap.tsx) và trang ExpertDirectoryView.tsx hiển thị danh sách các chuyên gia cây trồng.
```

---

### Lần sử dụng AI số 13

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Tách bài viết blog thành trang danh sách bài viết (BlogListView.tsx) và trang chi tiết bài viết (BlogDetailView.tsx) để tối ưu hóa SEO và khả năng đọc của người dùng. |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.13.1. Prompt đã sử dụng

```text
Tách giao diện BlogView.tsx thành hai thành phần chuyên biệt: BlogListView.tsx hiển thị danh sách bài viết dưới dạng lưới và BlogDetailView.tsx hiển thị nội dung bài viết chi tiết kèm theo thông tin tác giả.
```

---

### Lần sử dụng AI số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 19/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Phát triển dịch vụ quản lý giỏ hàng (Cart Service) ở Backend và viết các kịch bản kiểm thử API giỏ hàng (test_cart.js, test_cart_integration.js, test_products.js) để chạy giả lập các thao tác của người dùng. |
| Phần việc liên quan | Frontend / Backend / Testing / Debug |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.14.1. Prompt đã sử dụng

```text
Hãy giúp tôi hoàn thiện logic cho API giỏ hàng (Cart Service) và viết các script kiểm thử tích hợp (test_cart_integration.js, test_cart.js, test_products.js) để chạy giả lập luồng người dùng thêm sản phẩm vào giỏ, cập nhật số lượng, và kiểm tra tính toán tổng tiền.
```

---

### Lần sử dụng AI số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 19/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Thiết lập API xử lý luồng quên mật khẩu, sinh mã OTP khôi phục gửi qua email của người dùng và tạo tệp kiểm thử tự động tương ứng (test_forgot_password.js) để khôi phục mật khẩu tài khoản. |
| Phần việc liên quan | Backend / Testing / Debug |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.15.1. Prompt đã sử dụng

```text
Viết API hỗ trợ luồng quên mật khẩu: khi người dùng nhập email, hệ thống sẽ gửi OTP. Sau đó, viết script test_forgot_password.js để tự động gửi request verify OTP đặt lại mật khẩu mới nhằm kiểm tra tính an toàn.
```

---

### Lần sử dụng AI số 16

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Tái cấu trúc thư mục database chuyên biệt trên nhánh feature/database. Di chuyển greenlife.sql và patch_auth_fix.sql vào thư mục database/ mới tạo, dọn dẹp các tệp frontend/backend cũ trên nhánh này, đồng thời tạo Patch 01 (Verification Document) cùng tệp PowerShell run_patch.ps1 để chạy các file SQL. |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.16.1. Prompt đã sử dụng

```text
Tôi muốn dọn dẹp toàn bộ nhánh feature/database chỉ giữ lại các tệp liên quan đến database. Hãy di chuyển greenlife.sql và patch_auth_fix.sql vào thư mục database/ mới tạo, viết thêm patch_01_add_verification_document.sql và kịch bản run_patch.ps1 để chạy các file SQL bằng PowerShell.
```

---

### Lần sử dụng AI số 17

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Xây dựng và cấu trúc Patch 02 (Store Approval Audit) nhằm lưu trữ lịch sử phê duyệt cửa hàng của Admin và Patch 03 (Password Security) nhằm lưu trữ Salt/Hash bảo mật mật khẩu. Đóng gói thành Commit thứ 2 trên nhánh database. |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.17.1. Prompt đã sử dụng

```text
Hãy tạo patch_02_store_approval_audit.sql ghi lại lịch sử duyệt cửa hàng của admin và patch_03_password_security.sql để bổ sung cơ chế lưu trữ salt và hash mật khẩu cho người dùng. Commit các file này với thông điệp rõ ràng.
```

---

### Lần sử dụng AI số 18

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Xây dựng Patch 04 (Login Audit) ghi chép lịch sử đăng nhập để kiểm toán bảo mật và Patch 05 (Wishlist) hỗ trợ tính năng lưu sản phẩm yêu thích của khách hàng. Đóng gói thành Commit thứ 3 trên nhánh database. |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.18.1. Prompt đã sử dụng

```text
Viết patch_04_login_audit.sql ghi nhận log đăng nhập hệ thống (IP, thiết bị, trạng thái) và patch_05_wishlist.sql hỗ trợ danh sách yêu thích của người dùng. Commit chúng trên nhánh feature/database.
```

---

### Lần sử dụng AI số 19

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Thiết lập Patch 06 (Notifications - Thông báo), Patch 07 (Customer Addresses - Địa chỉ khách hàng) và Patch 08 (Bookings Snapshots & Lifecycle - Đặt lịch khám và vòng đời dịch vụ) kèm theo các kịch bản PowerShell tương ứng để dễ dàng cài đặt cục bộ. Đóng gói thành Commit thứ 4. |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.19.1. Prompt đã sử dụng

```text
Viết các bản vá database từ patch_06 đến patch_08 kèm theo các file PowerShell apply tương ứng để quản lý thông báo người dùng, thông tin địa chỉ giao hàng và cơ chế snapshot lưu vết trạng thái của booking.
```

---

### Lần sử dụng AI số 20

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Tạo các chỉ mục (Indexes) cho bảng plant_diagnoses (Patch 09) và bảng blog search (Patch 10) cùng các kịch bản thực thi PowerShell tự động nhằm nâng cao tốc độ truy vấn cơ sở dữ liệu. Đóng gói thành Commit thứ 5 và push toàn bộ 5 commit lên origin. |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.20.1. Prompt đã sử dụng

```text
Viết patch_09_diagnosis_indexes.sql tạo index cho bảng chẩn đoán cây và patch_10_blog_indexes.sql tạo index tối ưu tìm kiếm bài viết blog để tăng hiệu năng truy vấn. Commit và push lên nhánh feature/database.
```

---

### Lần sử dụng AI số 21

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Tích hợp Patch 11 (Cấu trúc bảng xác thực OTP, Refresh Token, Số lần đăng nhập sai, Thời gian khóa tài khoản) từ Downloads vào thư mục database/patches/, commit và push lên nhánh feature/database. |
| Phần việc liên quan | Database / Backend |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.21.1. Prompt đã sử dụng

```text
Hãy lấy patch 11 (bao gồm tệp SQL và tệp ps1) từ Downloads đưa vào thư mục database/patches/. Sau đó thực hiện commit 'update database', push lên nhánh feature/database.
```

---

### Lần sử dụng AI số 22

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/06/2026 |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / **Antigravity** / Khác |
| Mục đích sử dụng | Thực hiện merge nhánh database vào nhánh chính main, xử lý các xung đột trong tệp README.md và thực hiện push bản merge hoàn chỉnh lên origin để đồng bộ mã nguồn cho cả nhóm. |
| Phần việc liên quan | Database / Support |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.22.1. Prompt đã sử dụng

```text
Hãy merge nhánh feature/database vào main, giải quyết xung đột file README.md, sau đó push code lên origin main với nội dung release chi tiết.
```
