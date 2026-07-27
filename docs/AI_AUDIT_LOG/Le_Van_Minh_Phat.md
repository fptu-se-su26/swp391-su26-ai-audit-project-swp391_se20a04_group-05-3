# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A04 |
| Học kỳ | SU26 |
| Tên bài tập / Project | GreenLife – Plant Care Hub |
| Tên sinh viên | Lê Văn Minh Phát |
| MSSV | DE190206 |
| Giảng viên hướng dẫn | QuangLTN |
| Ngày bắt đầu | 11/05/2026 |
| Ngày hoàn thành | Chưa cập nhật |

---

## 2. Công cụ AI đã sử dụng

- [✓] ChatGPT
- [✓] Gemini
- [ ] Claude
- [✓] GitHub Copilot
- [ ] Cursor
- [✓] Antigravity
- [ ] Perplexity
- [ ] Microsoft Copilot
- [ ] Công cụ khác: Không

---

## 3. Mục tiêu sử dụng AI

- Phân tích yêu cầu và đề xuất cấu trúc frontend ReactJS cho GreenLife.
- Hỗ trợ xây dựng giao diện đăng nhập, danh sách cây, chi tiết cây và các thành phần dùng chung.
- Hỗ trợ tích hợp frontend với API backend Spring Boot.
- Hỗ trợ cấu hình Google OAuth, biến môi trường và xử lý đăng nhập.
- Hỗ trợ phát hiện, phân tích và sửa lỗi routing, npm, dữ liệu mock, đồng bộ dữ liệu và cấu hình cổng chạy.
- Hỗ trợ xây dựng kiểm thử tự động bằng Playwright theo Page Object Model.
- Hỗ trợ rà soát giao diện, chức năng, tài liệu báo cáo và nội dung thuyết trình.

### Mô tả mục tiêu sử dụng AI

AI được sử dụng như một công cụ hỗ trợ phân tích, gợi ý hướng triển khai, tạo mã khung và tìm nguyên nhân lỗi. Các kết quả do AI đưa ra không được sử dụng nguyên văn ngay lập tức mà được đối chiếu với yêu cầu môn học, cấu trúc source code thực tế, API backend, database SQL Server và kết quả chạy thử. Sinh viên chịu trách nhiệm lựa chọn giải pháp phù hợp, chỉnh sửa code, kiểm thử lại và giải thích được phần việc đã thực hiện.

---

## 4. Nhật ký sử dụng AI chi tiết

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/05/2026 |
| Công cụ AI | Gemini, GitHub Copilot, ChatGPT |
| Mục đích sử dụng | Thiết kế cấu trúc frontend ReactJS cho GreenLife |
| Phần việc liên quan | Design / Frontend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

Thiết kế cấu trúc project ReactJS cho GreenLife gồm trang đăng nhập, danh sách cây, chi tiết cây, các component dùng chung và lớp API service. Cấu trúc cần dễ bảo trì, có React Router và tách riêng phần gọi API.

#### 4.2. Kết quả AI gợi ý

AI gợi ý tổ chức source code thành các thư mục `components`, `pages` hoặc `views`, `services`, `hooks`, `utils`, `routes` và `assets`. AI đề xuất dùng React Router cho điều hướng, Axios cho gọi API và tạo các component dùng lại như Navbar, ProductCard, Loading, ErrorMessage và ProtectedRoute.

#### 4.3. Phần sinh viên đã sử dụng từ AI

Sinh viên sử dụng cách phân chia frontend theo trách nhiệm, tách phần giao diện khỏi phần gọi API và dùng component tái sử dụng cho danh sách cây, chi tiết cây và các trạng thái loading/error.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến

Sinh viên điều chỉnh lại tên thư mục, tên component và dữ liệu hiển thị để khớp với cấu trúc GreenLife thực tế. Các trường dữ liệu cây, cửa hàng, giá, hình ảnh và trạng thái sản phẩm được sửa theo API backend thay vì giữ dữ liệu ví dụ của AI. Sinh viên cũng kiểm tra lại route để tránh trùng đường dẫn và bổ sung xử lý khi không tìm thấy dữ liệu.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Cần bổ sung commit khởi tạo hoặc tổ chức frontend |
| File liên quan | `greenlife-frontend/src/components/`, `greenlife-frontend/src/pages/`, `greenlife-frontend/src/services/` |
| Screenshot | Cần bổ sung ảnh cấu trúc thư mục frontend và giao diện chạy thực tế |
| Kết quả chạy/test | Frontend khởi động được và điều hướng được giữa các trang chính |
| Link video demo | Chưa bổ sung |
| Ghi chú khác | Không sử dụng nguyên bản toàn bộ code AI; đã sửa theo source và API thực tế |

#### 4.6. Nhận xét cá nhân

AI giúp định hình cấu trúc ban đầu nhanh hơn, nhưng cấu trúc được đề xuất chỉ mang tính tổng quát. Để áp dụng vào GreenLife, sinh viên vẫn phải hiểu luồng dữ liệu và trách nhiệm của từng component, nếu không project dễ có nhiều file nhưng khó bảo trì.

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 02/06/2026 |
| Công cụ AI | ChatGPT, Gemini |
| Mục đích sử dụng | Tích hợp frontend với backend và xử lý API |
| Phần việc liên quan | Frontend / Backend Integration / Debug |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

Hướng dẫn kết nối frontend React/Vite của GreenLife với backend Spring Boot. Backend chạy ở localhost, frontend cần gọi API đăng nhập và API sản phẩm. Hãy chỉ ra cách cấu hình base URL, proxy và xử lý lỗi khi cổng backend thay đổi.

#### 4.2. Kết quả AI gợi ý

AI đề xuất khai báo `VITE_API_BASE_URL` trong file `.env`, đọc biến bằng `import.meta.env`, tạo Axios instance và cấu hình proxy trong `vite.config.ts` khi cần. AI cũng gợi ý kiểm tra CORS, cổng backend và URL endpoint khi request bị lỗi.

#### 4.3. Phần sinh viên đã sử dụng từ AI

Sinh viên áp dụng cách tách base URL khỏi source code, sử dụng biến môi trường và kiểm tra lại các cấu hình proxy đang trỏ tới `localhost:8080`.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến

Sinh viên kiểm tra cổng backend thực tế, đồng bộ lại URL giữa `.env`, Axios service và `vite.config.ts`. Khi backend chạy ở cổng khác, sinh viên sửa đúng vị trí thay vì thay đổi ngẫu nhiên toàn bộ project. Sinh viên cũng đối chiếu response thực tế từ backend để sửa mapping dữ liệu frontend.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Cần bổ sung commit cấu hình API hoặc proxy |
| File liên quan | `.env`, `.env.example`, `vite.config.ts`, các file API service |
| Screenshot | Cần bổ sung ảnh backend chạy thành công và Network tab của trình duyệt |
| Kết quả chạy/test | Frontend gọi được API backend; lỗi cổng và URL được xác định bằng log/Network |
| Link video demo | Chưa bổ sung |
| Ghi chú khác | Không đưa mật khẩu database hoặc secret thật vào báo cáo |

#### 4.6. Nhận xét cá nhân

AI giúp liệt kê nhanh các điểm cần kiểm tra, nhưng lỗi tích hợp thường không nằm ở một file duy nhất. Sinh viên học được cách kiểm tra từ backend, biến môi trường, proxy, endpoint đến dữ liệu response thay vì chỉ sửa giao diện.

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 14/07/2026 |
| Công cụ AI | ChatGPT, Antigravity |
| Mục đích sử dụng | Cấu hình Google OAuth cho chức năng đăng nhập |
| Phần việc liên quan | Frontend / Authentication / Configuration |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

Dự án React dùng `@react-oauth/google` và biến `VITE_GOOGLE_CLIENT_ID`, nhưng tôi chưa có Google Client ID. Hãy hướng dẫn từng bước tạo OAuth Client ID, thêm test user và cấu hình file `.env` để đăng nhập Google trên localhost.

#### 4.2. Kết quả AI gợi ý

AI hướng dẫn tạo project trên Google Cloud Console, cấu hình OAuth consent screen, thêm test user, tạo OAuth Client ID loại Web application, khai báo JavaScript origin cho localhost và đặt Client ID vào `VITE_GOOGLE_CLIENT_ID`.

#### 4.3. Phần sinh viên đã sử dụng từ AI

Sinh viên sử dụng quy trình cấu hình OAuth, thêm tài khoản thử nghiệm và khai báo biến môi trường cho frontend.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến

Sinh viên tự kiểm tra đúng origin/port đang chạy trên máy, không commit file `.env` chứa Client ID hoặc thông tin nhạy cảm. Sinh viên kiểm tra luồng đăng nhập trên giao diện và phân biệt rõ Google OAuth Client ID với cấu hình SMTP dùng để gửi email.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Cần bổ sung commit cập nhật `.env.example` hoặc cấu hình OAuth |
| File liên quan | `AuthView.tsx`, `.env`, `.env.example` |
| Screenshot | Cần bổ sung ảnh OAuth Client, test user và màn hình đăng nhập thành công |
| Kết quả chạy/test | Google Login hiển thị và thực hiện được trên môi trường localhost |
| Link video demo | Chưa bổ sung |
| Ghi chú khác | Che Client Secret và thông tin nhạy cảm khi chụp minh chứng |

#### 4.6. Nhận xét cá nhân

AI giúp hướng dẫn quy trình có nhiều bước cấu hình bên ngoài source code. Sinh viên hiểu rằng chỉ thêm email vào test user là chưa đủ; Client ID, consent screen, origin và phần xử lý token ở backend phải đồng bộ.

---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 14/07/2026 |
| Công cụ AI | Antigravity, ChatGPT |
| Mục đích sử dụng | Audit source code và phát hiện dữ liệu mock chưa được loại bỏ hoàn toàn |
| Phần việc liên quan | Frontend / Backend / Audit / Debug |
| Mức độ sử dụng | Hỗ trợ ý tưởng và phân tích |

#### 4.1. Prompt đã sử dụng

Hãy audit toàn bộ project GreenLife gồm frontend, backend và AI. Chỉ đọc source và viết investigation report/plan, không tự ý refactor, không thêm hoặc xóa chức năng. Tập trung kiểm tra dữ liệu mock còn sót, API thật, cấu hình môi trường, đăng nhập và sự đồng bộ giữa database với frontend.

#### 4.2. Kết quả AI gợi ý

AI lập danh sách các vị trí có khả năng chứa mock data, endpoint hardcoded, cấu hình base URL và các điểm cần so sánh giữa response backend với model frontend. AI cũng đề xuất kiểm tra branch đang chạy, trạng thái pull/merge và thư mục thực tế mà ứng dụng đang được khởi động.

#### 4.3. Phần sinh viên đã sử dụng từ AI

Sinh viên sử dụng checklist audit và cách khoanh vùng lỗi theo từng tầng: source đang chạy, branch hiện tại, API, database và UI.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến

Sinh viên tự chạy project bằng PowerShell, kiểm tra lại thư mục làm việc, tìm chuỗi mock/localhost trong source và so sánh dữ liệu hiển thị với dữ liệu SQL Server. Sinh viên không cho AI tự refactor toàn bộ dự án nhằm tránh phát sinh thay đổi ngoài phạm vi nhiệm vụ.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Cần bổ sung commit loại bỏ mock hoặc sửa mapping dữ liệu |
| File liên quan | `investigation_report.md`, các file data/service/component được audit |
| Screenshot | Cần bổ sung ảnh giao diện trước/sau và kết quả tìm kiếm mock data |
| Kết quả chạy/test | Xác định được source/thư mục chạy và các vị trí dữ liệu chưa đồng bộ |
| Link video demo | Chưa bổ sung |
| Ghi chú khác | Báo cáo AI chỉ dùng làm căn cứ review, không thay thế kiểm tra thủ công |

#### 4.6. Nhận xét cá nhân

AI hữu ích khi lập checklist cho project lớn, nhưng có thể kết luận sai nếu nó đọc nhầm branch hoặc thư mục. Sinh viên học được rằng phải xác minh source đang chạy trước khi tin vào kết quả audit.

---

### Lần sử dụng AI số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 08/07/2026 |
| Công cụ AI | ChatGPT, GitHub Copilot |
| Mục đích sử dụng | Xây dựng kiểm thử tự động Playwright theo Page Object Model |
| Phần việc liên quan | Testing / Frontend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

Hãy hướng dẫn xây dựng bộ kiểm thử Playwright TypeScript cho GreenLife theo Page Object Model. Không dùng CSS selector trong test, ưu tiên `data-testid`, không dùng hard wait và cần có các test cho đăng nhập, tìm kiếm, lọc, sắp xếp và hiển thị danh sách sản phẩm.

#### 4.2. Kết quả AI gợi ý

AI đề xuất cấu trúc `e2e/base`, `e2e/pages`, `e2e/tests`, `e2e/utils`; tạo `BasePage`, `LoginPage`, `ShopPage`, `NavigationPage`; dùng locator ổn định và assertion của Playwright. AI cũng gợi ý tách dữ liệu cấu hình khỏi test.

#### 4.3. Phần sinh viên đã sử dụng từ AI

Sinh viên sử dụng cấu trúc Page Object Model, các thao tác dùng chung như `goto`, `click`, `fill`, `waitVisible` và cách chia test theo module.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến

Sinh viên thay locator ví dụ bằng `data-testid` thực tế của GreenLife, sửa expected message theo validation thật trên giao diện và điều chỉnh chờ tải trang để giảm test không ổn định. Sinh viên chạy riêng từng module và chạy toàn bộ bộ test để xác nhận kết quả.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Cần bổ sung commit chứa bộ test Playwright |
| File liên quan | `e2e/base/BasePage.ts`, `e2e/pages/LoginPage.ts`, `e2e/pages/ShopPage.ts`, `e2e/tests/*.spec.ts` |
| Screenshot | Cần bổ sung ảnh terminal hiển thị kết quả 12 test passed |
| Kết quả chạy/test | `npm run test:e2e` — 12 test chạy thành công trong lần kiểm thử hoàn chỉnh |
| Link video demo | Chưa bổ sung |
| Ghi chú khác | Kết quả test phụ thuộc dữ liệu và môi trường chạy thực tế |

#### 4.6. Nhận xét cá nhân

AI giúp tạo nhanh bộ khung test, nhưng locator và expected result phải lấy từ sản phẩm thực tế. Sinh viên hiểu rõ hơn vai trò của Page Object Model trong việc giảm lặp code và bảo trì test.

---

### Lần sử dụng AI số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 15/07/2026 |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Sửa lỗi cấu hình Playwright trong môi trường ES Module |
| Phần việc liên quan | Testing / Debug / Configuration |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

Khi chạy `npm run test:e2e`, project báo `ReferenceError: __dirname is not defined in ES module scope` tại `e2e/utils/configReader.ts`. Hãy giải thích nguyên nhân và sửa theo chuẩn ES Module.

#### 4.2. Kết quả AI gợi ý

AI giải thích rằng `__dirname` không tồn tại mặc định trong ES Module và đề xuất tạo lại bằng `fileURLToPath(import.meta.url)` kết hợp với `dirname`, hoặc dùng `process.cwd()` nếu đường dẫn cần tính từ thư mục chạy project.

#### 4.3. Phần sinh viên đã sử dụng từ AI

Sinh viên sử dụng cách chuyển `import.meta.url` thành đường dẫn file để thay thế `__dirname` trong utility đọc cấu hình.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến

Sinh viên kiểm tra vị trí thực tế của file cấu hình và điều chỉnh đường dẫn tương đối cho đúng project. Sau sửa lỗi, sinh viên chạy lại toàn bộ test thay vì chỉ xác nhận hết lỗi biên dịch.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Cần bổ sung commit sửa `configReader.ts` |
| File liên quan | `e2e/utils/configReader.ts` |
| Screenshot | Cần bổ sung ảnh lỗi trước khi sửa và kết quả chạy sau khi sửa |
| Kết quả chạy/test | Không còn lỗi `__dirname is not defined`; Playwright đọc được cấu hình |
| Link video demo | Chưa bổ sung |
| Ghi chú khác | Cần bảo đảm giải pháp đường dẫn hoạt động trên máy thành viên khác |

#### 4.6. Nhận xét cá nhân

AI giúp giải thích đúng khác biệt giữa CommonJS và ES Module. Tuy nhiên, lựa chọn `process.cwd()` hay `import.meta.url` phải dựa trên cách project được chạy, không nên sao chép máy móc.

---

### Lần sử dụng AI số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 21/07/2026 |
| Công cụ AI | ChatGPT, Gemini |
| Mục đích sử dụng | Hoàn thiện báo cáo và chuẩn bị nội dung thuyết trình GreenLife |
| Phần việc liên quan | Report / Presentation |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

Dựa trên chức năng thực tế của GreenLife, hãy giúp tôi xây dựng nội dung thuyết trình từ ý tưởng, kiến trúc, chức năng mua cây, đặt lịch chăm sóc cây, AI chẩn đoán bệnh cây, kiểm thử và định hướng phát triển. Nội dung cần dễ nói và không phóng đại kết quả.

#### 4.2. Kết quả AI gợi ý

AI đề xuất bố cục phần mở đầu, vấn đề, giải pháp, đối tượng sử dụng, kiến trúc, chức năng chính, quy trình kiểm thử, kết quả và hướng phát triển. AI cũng gợi ý cách diễn đạt ngắn gọn phù hợp với thuyết trình nhóm.

#### 4.3. Phần sinh viên đã sử dụng từ AI

Sinh viên sử dụng bố cục và cách chuyển ý giữa các phần để hoàn thiện lời thuyết trình và báo cáo.

#### 4.4. Phần sinh viên tự chỉnh sửa hoặc cải tiến

Sinh viên đối chiếu nội dung với chức năng thực sự đã chạy, loại bỏ các mô tả chưa được triển khai hoặc chưa có minh chứng. Tên công nghệ, số lượng test và kết quả demo được sửa theo dữ liệu thực tế của nhóm.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Cần bổ sung commit cập nhật báo cáo/slide nếu có |
| File liên quan | Báo cáo GreenLife, slide thuyết trình, script thuyết trình |
| Screenshot | Cần bổ sung ảnh slide hoặc buổi demo |
| Kết quả chạy/test | Nội dung đã được đối chiếu với sản phẩm và kết quả kiểm thử |
| Link video demo | Chưa bổ sung |
| Ghi chú khác | AI hỗ trợ diễn đạt; sinh viên chịu trách nhiệm tính chính xác của nội dung |

#### 4.6. Nhận xét cá nhân

AI giúp diễn đạt nội dung rõ ràng hơn, nhưng có xu hướng bổ sung những điểm nghe hợp lý mà project chưa chắc đã hoàn thành. Vì vậy, mọi nội dung báo cáo phải được kiểm tra bằng source code, test hoặc demo thực tế.

---

## 5. Bảng tổng hợp mức độ sử dụng AI

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  | X |  |  | AI hỗ trợ tách yêu cầu, nhóm tự đối chiếu SRS |
| Viết user story/use case |  | X |  |  | AI hỗ trợ diễn đạt, không quyết định nghiệp vụ |
| Thiết kế database | X |  |  |  | Không phải phần AI hỗ trợ chính của cá nhân |
| Thiết kế kiến trúc hệ thống |  | X |  |  | AI gợi ý cấu trúc frontend và luồng tích hợp |
| Thiết kế giao diện |  |  | X |  | AI gợi ý layout/component, sinh viên tự chỉnh UI |
| Code frontend |  |  | X |  | AI tạo khung và gợi ý logic, sinh viên chỉnh theo API |
| Code backend |  | X |  |  | Chủ yếu dùng để hiểu endpoint và tích hợp |
| Debug lỗi |  |  | X |  | AI gợi ý hướng kiểm tra, sinh viên tự chạy và xác minh |
| Viết test case |  |  | X |  | AI hỗ trợ thiết kế kịch bản Playwright |
| Kiểm thử sản phẩm |  | X |  |  | Sinh viên trực tiếp chạy test và kiểm tra UI |
| Tối ưu code |  | X |  |  | AI gợi ý tách component và tái sử dụng logic |
| Viết báo cáo |  |  | X |  | AI hỗ trợ bố cục và diễn đạt |
| Làm slide thuyết trình |  |  | X |  | AI hỗ trợ dàn ý, sinh viên chỉnh theo sản phẩm thật |

---

## 6. Các lỗi hoặc hạn chế từ AI

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | AI đề xuất field hoặc endpoint không khớp API GreenLife | So sánh request/response trong Network và source backend | Sửa model, endpoint và mapping theo API thực tế |
| 2 | Locator/expected message trong test mẫu không tồn tại trên UI | Chạy Playwright và đọc lỗi `element not found` hoặc strict mode | Bổ sung `data-testid`, dùng text/role thực tế và sửa assertion |
| 3 | AI có thể kết luận còn mock data nhưng đang đọc nhầm branch/thư mục | So sánh `git branch`, `git status`, đường dẫn PowerShell và source đang chạy | Xác nhận branch, pull mới nhất và thư mục chạy trước khi sửa code |
| 4 | Gợi ý cấu hình đường dẫn có thể chỉ chạy trên một máy | Chạy trên môi trường khác hoặc sau khi đổi thư mục project | Dùng đường dẫn tương đối chuẩn ES Module và tránh hardcode đường dẫn máy cá nhân |
| 5 | Nội dung báo cáo do AI tạo có thể phóng đại chức năng hoặc kết quả | Đối chiếu với source, testcase và demo thực tế | Loại bỏ nội dung chưa triển khai; chỉ ghi nhận kết quả có minh chứng |

---

## 7. Kiểm chứng kết quả AI

### Nội dung kiểm chứng

Sinh viên kiểm chứng các kết quả do AI gợi ý theo các bước sau:

1. Đối chiếu với yêu cầu của môn học, SRS và phạm vi chức năng GreenLife.
2. Đọc lại code do AI gợi ý để bảo đảm hiểu được luồng xử lý trước khi áp dụng.
3. Chạy backend Spring Boot và frontend React trên môi trường local, theo dõi log terminal và Console của trình duyệt.
4. Dùng Network tab để kiểm tra URL, request body, status code và response thực tế từ backend.
5. Kiểm tra dữ liệu trực tiếp trong SQL Server để xác định dữ liệu frontend có đồng bộ với database hay không.
6. Chạy kiểm thử Playwright theo từng module và chạy toàn bộ suite bằng `npm run test:e2e`.
7. Thực hiện kiểm thử thủ công cho đăng nhập, điều hướng, tìm kiếm, lọc, sắp xếp và hiển thị sản phẩm.
8. Review kết quả cùng thành viên nhóm trước khi merge hoặc trình bày.
9. Không sử dụng kết quả AI khi chưa có minh chứng source code, log chạy, testcase hoặc ảnh giao diện.

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Sinh viên trực tiếp tham gia phần frontend và kiểm thử của GreenLife, bao gồm tổ chức cấu trúc ReactJS, xây dựng hoặc hoàn thiện giao diện đăng nhập, danh sách cây, chi tiết cây, tích hợp API backend, cấu hình Google OAuth, xử lý lỗi npm/routing/cổng chạy và rà soát dữ liệu mock. Sinh viên cũng tham gia xây dựng và chạy bộ kiểm thử Playwright theo Page Object Model, phân tích lỗi test và chuẩn bị tài liệu thuyết trình.

AI chủ yếu hỗ trợ cung cấp kiến thức nền, khung code, checklist audit, hướng debug và cách diễn đạt báo cáo. Sinh viên chịu trách nhiệm sửa code theo dữ liệu thật, kiểm tra trên máy local, xác nhận kết quả và loại bỏ các đề xuất không phù hợp.

### 8.2. Đối với bài nhóm

> Bảng dưới đây cần được nhóm bổ sung chính xác theo danh sách thành viên và phân công chính thức. Không nên tự điền nếu chưa có xác nhận.

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Lê Văn Minh Phát | DE190206 | Frontend, tích hợp API, kiểm thử và hỗ trợ tài liệu | Có | Commit cá nhân, file frontend, test Playwright, ảnh demo |
| [Bổ sung thành viên 2] | [MSSV] | [Nhiệm vụ] | Có / Không | [Commit/Jira/file] |
| [Bổ sung thành viên 3] | [MSSV] | [Nhiệm vụ] | Có / Không | [Commit/Jira/file] |
| [Bổ sung thành viên 4] | [MSSV] | [Nhiệm vụ] | Có / Không | [Commit/Jira/file] |
| [Bổ sung thành viên 5 nếu có] | [MSSV] | [Nhiệm vụ] | Có / Không | [Commit/Jira/file] |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em ở điểm nào?

AI giúp em tiết kiệm thời gian tra cứu công nghệ, định hình cấu trúc frontend, xây dựng code khung, lập checklist debug và thiết kế kiểm thử. Đặc biệt, AI hữu ích khi giải thích các lỗi cấu hình như biến môi trường, proxy, OAuth, ES Module và khi cần phân tích nhiều nguyên nhân có thể xảy ra trong quá trình tích hợp frontend với backend.

### 9.2. Phần nào em không sử dụng theo gợi ý của AI? Vì sao?

Em không sử dụng những đoạn code có endpoint, field dữ liệu hoặc cấu trúc thư mục không khớp với source GreenLife. Em cũng không cho AI tự động refactor toàn bộ project vì việc đó có thể làm thay đổi chức năng ngoài yêu cầu và gây xung đột với code của các thành viên khác. Những nội dung báo cáo không có minh chứng hoặc mô tả chức năng chưa hoàn thành cũng bị loại bỏ.

### 9.3. Em đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

Em đọc và giải thích lại code, chạy chương trình trên local, kiểm tra log backend, Console và Network của frontend, đối chiếu dữ liệu SQL Server, chạy test Playwright và kiểm thử thủ công. Khi có sai khác, em ưu tiên source code và kết quả chạy thực tế thay vì câu trả lời của AI.

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

Phần khó khăn nhất sẽ là tìm nguyên nhân cho các lỗi tích hợp có nhiều lớp, chẳng hạn frontend không đồng bộ dữ liệu, cấu hình OAuth, cổng backend, proxy và lỗi test tự động. Việc tra cứu từng lỗi riêng lẻ sẽ mất nhiều thời gian hơn, đặc biệt khi thông báo lỗi không chỉ rõ nguyên nhân gốc.

### 9.5. Sau bài tập/project này, em học được gì về môn học?

Em hiểu rõ hơn quy trình phát triển một hệ thống web theo nhóm, từ phân tích yêu cầu, tổ chức source code, tích hợp frontend–backend–database, quản lý cấu hình môi trường đến kiểm thử và chuẩn bị demo. Em cũng học được rằng một chức năng chỉ được xem là hoàn thành khi có thể chạy, kiểm thử và giải thích được, không chỉ khi code đã được viết.

### 9.6. Sau bài tập/project này, em học được gì về cách sử dụng AI có trách nhiệm?

Em học được rằng AI nên được dùng như công cụ hỗ trợ chứ không phải nguồn quyết định cuối cùng. Prompt cần giới hạn rõ phạm vi, đặc biệt khi audit hoặc sửa project nhóm. Mọi code và nội dung do AI tạo phải được kiểm tra, không được đưa secret vào prompt hoặc commit, phải khai báo trung thực mức độ sử dụng AI và phải chịu trách nhiệm về sản phẩm cuối cùng.

---

## 10. Cam kết học thuật

Sinh viên cam kết rằng:

- Nội dung AI hỗ trợ đã được ghi nhận trung thực.
- Không nộp nguyên văn kết quả AI mà không kiểm tra.
- Có khả năng giải thích các phần đã nộp.
- Chịu trách nhiệm về tính đúng đắn của sản phẩm cuối cùng.
- Hiểu rằng việc sử dụng AI không khai báo có thể ảnh hưởng đến kết quả đánh giá.

| Đại diện sinh viên | Ngày xác nhận |
|---|---|
| Lê Văn Minh Phát | Chưa cập nhật |
