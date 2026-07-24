# AI Audit Log - GreenLife Project

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Project SWP391 |
| Mã môn học | SWP391 |
| Lớp | SE20A04 |
| Học kỳ | SU26 |
| Tên bài tập / Project | GreenLife - Nền tảng dịch vụ cây cảnh trực tuyến |
| Tên sinh viên / Nhóm | Dương Thành Long |
| MSSV / Danh sách MSSV | DE190230 |
| Vai trò / Trách nhiệm | Backend Developer |
| Giảng viên hướng dẫn | Giảng viên bộ môn SWP391 |
| Ngày bắt đầu | 01/06/2026 |
| Ngày hoàn thành | 21/07/2026 |

---

## 2. Công cụ AI đã sử dụng

Các công cụ AI đã được cá nhân sử dụng trong suốt quá trình phát triển backend dự án và kiểm toán bảo mật:

- [x] ChatGPT (Hỗ trợ phân tích kiến trúc backend, thiết kế database migration và DTO)
- [x] Claude (Hỗ trợ tối ưu hóa logic service layer và viết JUnit test cases)
- [x] Antigravity (Đại diện kiểm toán, rà soát lỗ hổng API và khắc phục lỗi biên dịch backend)
- [x] GitHub Copilot (Hỗ trợ sinh mã nguồn Spring Boot nhanh trong quá trình phát triển)

---

## 3. Mục tiêu sử dụng AI

Dương Thành Long đã sử dụng các công cụ AI nhằm mục đích tăng tốc quá trình phát triển backend, đảm bảo chất lượng kiểm thử tự động và nâng cao tính bảo mật của hệ thống GreenLife. Cụ thể:

- **Phân tích yêu cầu**: GAP Analysis hệ thống xác thực backend cũ, lập kế hoạch nâng cấp cơ chế OTP SHA-256 và token cookie bảo mật.
- **Thiết kế Database & Contract**: Thiết kế các patch database migration hỗ trợ bảo mật (failed login counter, lockout_end, tables `user_otps`, `refresh_tokens`) và cấu trúc dữ liệu địa giới hành chính 2 cấp.
- **Phát triển Backend Layer**: Viết cấu trúc DTO, service layer cho xác thực hai lớp, đăng ký cửa hàng, KYC multipart upload và tách biệt DTO public / Admin review.
- **Kiểm toán bảo mật Backend**: Phát hiện và loại bỏ nguy cơ lộ lọt dữ liệu nhạy cảm (CCCD, minh chứng kinh doanh) trong `StoreResponse` công khai; bảo mật exception message.
- **Tối ưu & Tự động hóa**: Xây dựng các bộ unit test tự động bằng JUnit (`SellerOtpIntegrationTest`, `StoreKycIntegrationTest`, `EmailServiceImplTest`, `ChatRateLimiterTest`) kiểm chứng các hàm backend cốt lõi.

---

## 4. Nhật ký sử dụng AI chi tiết

### Lần sử dụng AI số 1: Tái thiết kế kiến trúc xác thực Email OTP và Quản lý Token Backend

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 10/06/2026 |
| Công cụ AI | ChatGPT / Claude |
| Mục đích sử dụng | Thiết kế kiến trúc OTP backend mã hóa SHA-256 và GAP Analysis quy trình xác thực người bán |
| Phần việc liên quan | Backend / Database / Security |
| Mức độ sử dụng | Hỗ trợ nhiều / Định hình kiến trúc |

#### 4.1. Prompt đã sử dụng
> "Hãy phân tích nguyên nhân lỗi và lỗ hổng bảo mật của hệ thống đăng ký người dùng hiện tại khi không xác thực email. Hãy kiểm tra contract giữa controller, service và DTO, đề xuất cách thiết kế bảng user_otps lưu mã OTP mã hóa SHA-256 có thời hạn hết hạn và tích hợp gửi mail qua EmailService."

#### 4.2. Kết quả AI gợi ý
AI đã phân tích các lỗ hổng bảo mật backend:
- Đăng ký tài khoản không xác minh OTP email thực sự.
- Lưu trữ OTP ở dạng plain-text nguy hiểm nếu database bị truy cập trái phép.
- Thiếu logic hủy OTP cũ khi người dùng yêu cầu mã mới.
AI đề xuất bảng `user_otps` với các trường mã hóa SHA-256 và cấu hình Spring Mail cho `EmailServiceImpl`.

#### 4.3. Phần sinh viên đã sử dụng từ AI
- Ý tưởng mã hóa OTP SHA-256 trước khi lưu vào database `user_otps`.
- Cấu trúc hàm gửi email OTP trong `EmailServiceImpl`.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến
- **Dương Thành Long (Backend)**: Đã kiểm tra và giới hạn phạm vi đề xuất của AI vào đúng backend contract. Trực tiếp cài đặt hàm băm SHA-256 trong `UserOtp`, bổ sung kiểm tra thời gian hết hạn (`expires_at`), và viết bộ test `SellerOtpIntegrationTest` cùng `EmailServiceImplTest` để đảm bảo không lọt OTP bypass.

#### 4.5. Minh chứng
- Backend source updated locally: `UserOtp.java`, `EmailServiceImpl.java`, `SellerOtpIntegrationTest.java`.
- Trạng thái kiểm chứng: Đã cập nhật mã nguồn backend cục bộ; kết quả chạy thử nghiệm unit test đạt yêu cầu.

---

### Lần sử dụng AI số 2: Xử lý đăng ký cửa hàng, KYC Persistence và Multipart Upload Backend

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 25/06/2026 |
| Công cụ AI | Claude / ChatGPT |
| Mục đích sử dụng | Thiết kế service layer xử lý upload hồ sơ KYC multipart và lưu trữ thông tin minh chứng cửa hàng |
| Phần việc liên quan | Backend / Store Service |
| Mức độ sử dụng | Hỗ trợ trung bình |

#### 4.2.1. Prompt đã sử dụng
> "Hãy kiểm tra contract giữa controller, service và DTO cho tính năng đăng ký cửa hàng (Store Registration). Đề xuất cách thiết kế DTO nhận dữ liệu multipart bao gồm ảnh CCCD/CMND, giấy phép kinh doanh và mapping vào entity StoreKYC an toàn."

#### 4.2.2. Kết quả AI gợi ý
AI đề xuất:
- Tạo `StoreRegistrationRequest` chứa thông tin cơ bản và mảng file upload multipart.
- Tự động chuyển đổi file lưu trữ vào thư mục local và lưu đường dẫn file vào entity `StoreKYC`.

#### 4.2.3. Phần sinh viên đã sử dụng từ AI
- Cấu trúc mapping DTO `StoreRegistrationRequest` và entity `StoreKYC`.

#### 4.2.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến
- **Dương Thành Long (Backend)**: Phát hiện gợi ý của AI thiếu kiểm tra định dạng file upload (MIME type) và dung lượng tối đa. Đã chủ động bổ sung validate MIME type (chỉ nhận JPG/PNG/PDF), giới hạn dung lượng file 5MB và viết `StoreKycIntegrationTest` để kiểm chứng luồng lưu trữ KYC.

#### 4.2.5. Minh chứng
- Backend source updated locally: `StoreService.java`, `StoreKYC.java`, `StoreKycIntegrationTest.java`.
- Trạng thái kiểm chứng: Mã nguồn backend đã được cập nhật tại local; database patch hỗ trợ lưu trữ KYC đã được chuẩn bị nhưng chưa chạy trên production.

---

### Lần sử dụng AI số 3: Rà soát bảo mật truy cập dữ liệu KYC và tách biệt DTO Public vs Restricted Admin

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 08/07/2026 |
| Công cụ AI | Antigravity / ChatGPT |
| Mục đích sử dụng | Rà soát nguy cơ lộ dữ liệu KYC nhạy cảm qua API công khai và thiết kế DTO quản trị Admin |
| Phần việc liên quan | Backend Security / API Contract |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.3.1. Prompt đã sử dụng
> "Hãy rà soát nguy cơ lộ dữ liệu KYC qua API công khai của cửa hàng. Kiểm tra StoreResponse hiện tại và đề xuất cách tách biệt giữa Public StoreResponse (cho khách hàng) và AdminStoreResponse restricted (chỉ dành cho Quản trị viên duyệt hồ sơ)."

#### 4.3.2. Kết quả AI gợi ý
AI rà soát và xác nhận:
- `StoreResponse` công khai ban đầu vô tình chứa thông tin chi tiết số CCCD và đường dẫn ảnh minh chứng cá nhân của chủ cửa hàng.
- AI đề xuất tạo `AdminStoreResponse` riêng biệt trong `AdminStoreController` chỉ trả về thông tin nhạy cảm khi request có quyền `ROLE_ADMIN`.

#### 4.3.3. Phần sinh viên đã sử dụng từ AI
- Cấu trúc thiết kế lớp `AdminStoreResponse` và phân quyền endpoint `/api/v1/admin/stores/{id}/kyc`.

#### 4.3.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến
- **Dương Thành Long (Backend)**: Đã phát hiện và ngăn chặn nguy cơ lộ dữ liệu CCCD qua public API. Loại bỏ toàn bộ các trường nhạy cảm khỏi public `StoreResponse`, cập nhật `AdminStoreController` để kiểm tra chặt chẽ annotation `@PreAuthorize("hasRole('ADMIN')")`, đồng thời viết `AdminStoreControllerTest` kiểm tra truy cập trái phép.

#### 4.3.5. Minh chứng
- Backend source updated locally: `AdminStoreController.java`, `AdminStoreResponse.java`, `AdminStoreControllerTest.java`.
- Trạng thái kiểm chứng: Mã nguồn backend đã sửa đổi và kiểm tra phân quyền tại môi trường phát triển cục bộ.

---

### Lần sử dụng AI số 4: Tương thích DTO/Entity Địa chỉ và Xây dựng API Đơn vị Hành chính 2 cấp

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 15/07/2026 |
| Công cụ AI | Claude |
| Mục đích sử dụng | Thiết kế API đọc tỉnh/thành, xã/phường và đảm bảo tương thích 2 cấp địa chỉ giữa DTO và Entity |
| Phần việc liên quan | Backend Service / Administrative Units |
| Mức độ sử dụng | Hỗ trợ trung bình |

#### 4.4.1. Prompt đã sử dụng
> "Hãy đề xuất API đọc tỉnh/thành và xã/phường từ database cho hệ thống GreenLife. Đảm bảo tương thích contract dữ liệu địa chỉ hai cấp (Province, Commune) với entity Address hiện tại mà không làm gãy các API khách hàng cũ."

#### 4.4.2. Kết quả AI gợi ý
AI đề xuất:
- Tạo các entity `Province` và `Commune` liên kết 1-n.
- Xây dựng `AdministrativeUnitService` với các phương thức read-only lấy danh sách Tỉnh/Thành và Xã/Phường.
- Ánh xạ thông tin địa chỉ trong `AddressDTO` để giữ tương thích với dữ liệu địa chỉ khách hàng.

#### 4.4.3. Phần sinh viên đã sử dụng từ AI
- Cấu trúc service read-only `AdministrativeUnitService` và bộ định dạng DTO địa chính.

#### 4.4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến
- **Dương Thành Long (Backend)**: Từ chối dữ liệu địa chính do AI tự sinh giả lập. Yêu cầu giữ nguyên cơ chế đọc dữ liệu chuẩn từ nguồn hạt nhân database. Đã kiểm tra tính tương thích giữa `Address` entity và `AddressDTO`, xử lý null-safety khi người dùng chọn địa chỉ 2 cấp mới hoặc địa chỉ legacy cũ.

#### 4.4.5. Minh chứng
- Backend source updated locally: `AdministrativeUnitService.java`, `ProvinceRepository.java`, `CommuneRepository.java`, `Address.java`.
- Trạng thái kiểm chứng: Đã tích hợp API read-only cục bộ; dữ liệu địa chính đã sẵn sàng trong cấu trúc backend.

---

### Lần sử dụng AI số 5: Chẩn đoán lỗi biên dịch Backend, Khôi phục Chat Rate Limiter và Bảo mật Exception

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 21/07/2026 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Hãy kiểm tra lỗi compile, xác định file cần sửa và khởi động an toàn Spring Boot application |
| Phần việc liên quan | Backend Bugfix / Security Maintenance |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.5.1. Prompt đã sử dụng
> "Hãy kiểm tra lỗi compile và xác định file cần sửa trong module backend. Hãy đề xuất cách sửa tối thiểu, không refactor ngoài phạm vi đối với lớp ChatRateLimiter và các controller bị lỗi thiếu constructor."

#### 4.5.2. Kết quả AI gợi ý
AI đã phân tích log biên dịch Maven và phát hiện:
- Lớp `ChatRateLimiter` thiếu no-args constructor gây lỗi khi Spring Bean Container khởi tạo.
- Một số exception handler trả về stacktrace chi tiết ra client gây lộ thông tin hạ tầng.
AI đề xuất thêm `@NoArgsConstructor` cho `ChatRateLimiter` và ẩn stacktrace trong `GlobalExceptionHandler`.

#### 4.5.3. Phần sinh viên đã sử dụng từ AI
- Giải pháp sửa lỗi constructor trong `ChatRateLimiter` và cấu hình lọc thông báo exception.

#### 4.5.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến
- **Dương Thành Long (Backend)**: Giới hạn phạm vi sửa lỗi ở mức tối thiểu, tuyệt đối không refactor các component không liên quan. Đã thêm constructor thích hợp cho `ChatRateLimiter`, kiểm chứng lại bộ test `ChatRateLimiterTest`, đảm bảo backend Spring Boot biên dịch sạch sẽ và khởi động an toàn mà không lộ exception nhạy cảm.

#### 4.5.5. Minh chứng
- Backend source updated locally: `ChatRateLimiter.java`, `ChatRateLimiterTest.java`, `GlobalExceptionHandler.java`.
- Trạng thái kiểm chứng: Lỗi biên dịch đã được khắc phục hoàn toàn trên môi trường local; ứng dụng Spring Boot khởi động an toàn.

---

## 5. Nhật ký audit các tính năng cụ thể

### 5.1. Xác thực OTP Email Người bán & Token Security (Seller OTP & Security)
- **Mô tả**: Quy trình tạo và gửi mã xác thực OTP qua email khi người dùng đăng ký hoặc khôi phục tài khoản người bán.
- **AI đề xuất**: Thuật toán sinh mã 6 chữ số ngẫu nhiên và lưu trữ tạm thời vào cache/database.
- **Con người kiểm chứng (Dương Thành Long)**: Kiểm tra và triển khai cơ chế băm SHA-256 cho mã OTP trước khi ghi vào database `user_otps`. Loại bỏ hoàn toàn mã OTP bypass "123456" ở phía backend, viết unit test `SellerOtpIntegrationTest` xác minh thời gian hết hạn 5 phút và giới hạn 3 lần thử sai.

### 5.2. Hồ sơ KYC Cửa hàng & Bảo mật CCCD/Minh chứng doanh nghiệp (Store KYC & Restricted Admin DTO)
- **Mô tả**: Tiếp nhận và xác minh tài liệu KYC (CCCD, Giấy phép kinh doanh) của cửa hàng đối tác.
- **AI đề xuất**: API tiếp nhận file multipart và trả về đầy đủ đối tượng `Store` bao gồm thông tin KYC cho client.
- **Con người kiểm chứng (Dương Thành Long)**: Phát hiện rủi ro lộ lọt thông tin riêng tư (CCCD). Thực hiện tách biệt contract: loại bỏ toàn bộ dữ liệu KYC khỏi public `StoreResponse` trả cho khách hàng, tạo `AdminStoreResponse` chỉ cung cấp thông tin nhạy cảm cho Quản trị viên qua `AdminStoreController` được bảo mật bằng `@PreAuthorize("hasRole('ADMIN')")`.

### 5.3. Địa giới hành chính & Đơn vị hành chính 2 cấp (Administrative Province & Commune API)
- **Mô tả**: API cung cấp danh mục Tỉnh/Thành phố và Xã/Phường phục vụ chọn địa chỉ giao hàng và đăng ký cửa hàng.
- **AI đề xuất**: Sinh tự động danh sách địa giới hành chính mock trong memory.
- **Con người kiểm chứng (Dương Thành Long)**: Bác bỏ dữ liệu mock của AI. Thiết kế `AdministrativeUnitService` kết nối trực tiếp repository database chuẩn, xây dựng contract địa chỉ 2 cấp tương thích với `Address` entity và `AddressDTO` cũ của khách hàng.

### 5.4. Chatbot Rate Limiter & Sửa lỗi khởi động Spring (Chat Rate Limiter & Backend Recovery)
- **Mô tả**: Bộ lọc giới hạn tần suất gửi tin nhắn tới Chatbot nhằm phòng chống tấn công DoS / lãng phí API quota.
- **AI đề xuất**: Thuật toán Token Bucket lưu trong Spring Bean `ChatRateLimiter`.
- **Con người kiểm chứng (Dương Thành Long)**: Phát hiện và sửa lỗi thiếu constructor khiến Spring Boot container không khởi tạo được `ChatRateLimiter` trên môi trường runtime. Viết bộ kiểm thử `ChatRateLimiterTest` xác minh tính chính xác của thuật toán chặn request vượt quá ngưỡng.

### 5.5. Hợp đồng dữ liệu đơn hàng, giỏ hàng & Khuyến mãi (Order, Cart & Promotion Backend Pricing Calculation)
- **Mô tả**: Tính toán giá trị giỏ hàng, áp dụng mã giảm giá và tính tổng tiền thanh toán từ phía máy chủ.
- **AI đề xuất**: Cho phép client gửi giá đã tính toán sẵn lên backend để tiết kiệm thời gian xử lý.
- **Con người kiểm chứng (Dương Thành Long)**: Nghiêm cấm client truyền giá trị tiền tệ. Bắt buộc toàn bộ logic giá sản phẩm, giảm giá promotion và tổng tiền đơn hàng phải được tính toán chính xác tuyệt đối tại Backend Service layer để chống gian lận thương mại.

---

## 6. Vai trò của sinh viên trong quá trình AI Audit

- **Dương Thành Long (Backend Developer)**: Trực tiếp thiết kế DTO/Service layer, tối ưu hóa truy vấn SQL và cấu trúc bảo mật API, biên dịch mã nguồn backend, tích hợp API xác thực/KYC/địa giới hành chính, chạy các bộ unit test tự động bằng Maven và xác nhận ứng dụng Spring Boot khởi động an toàn trên môi trường phát triển.

*Lưu ý: Tất cả các cấu hình bảo mật nhạy cảm (JWT secret key, SMTP password, PayOS client ID) đều được tách biệt ra các biến môi trường hệ thống. Không có bất kỳ thông tin bí mật nào được đưa vào prompts hoặc lưu trữ trong các file cấu hình mã nguồn.*

---

## 7. Cam kết học thuật

Sinh viên cam kết rằng:
- Việc sử dụng AI chỉ mang tính chất hỗ trợ đẩy nhanh tiến độ và kiểm toán tính đúng đắn của mã nguồn backend.
- Tất cả nội dung do AI gợi ý đã được sinh viên trực tiếp đọc hiểu, kiểm tra và chạy thử nghiệm kỹ lưỡng.
- Sinh viên chịu toàn bộ trách nhiệm về tính đúng đắn của phần việc backend được giao.

| Sinh viên xác nhận | Ngày xác nhận |
|---|---|
| Dương Thành Long | 21/07/2026 |
