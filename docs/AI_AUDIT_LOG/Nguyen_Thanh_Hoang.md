# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A04 |
| Học kỳ | SU26 |
| Tên bài tập / Project | GreenLife – Plant Care Hub |
| Tên sinh viên | Nguyễn Thanh Hoàng |
| MSSV | DE190354 |
| Giảng viên hướng dẫn | QuangLTN |
| Ngày bắt đầu | 11/05/2026 |
| Ngày hoàn thành | Chưa cập nhật |

---

## 2. Công cụ AI đã sử dụng

- [ ] ChatGPT
- [x] Gemini (Tích hợp API Gemini 1.5/2.0 Flash xử lý đa phương thức vision chẩn đoán bệnh lá & Chatbot tư vấn)
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity (AI Agent hỗ trợ thiết kế full-stack, refactoring code, tối ưu hóa payload & debug CSDL)
- [ ] Perplexity
- [ ] Microsoft Copilot
- [ ] Công cụ khác: Không

---

## 3. Mục tiêu sử dụng AI

- [x] Phân tích yêu cầu bài toán
- [x] Gợi ý ý tưởng giải pháp
- [x] Thiết kế database
- [x] Thiết kế giao diện
- [x] Viết code mẫu
- [x] Debug lỗi
- [x] Tối ưu code (Performance & Image Downscaling)
- [x] Viết test case
- [x] Kiểm tra bảo mật (Domain Guardrails & Safety Prompting)
- [x] Viết báo cáo / AI Audit Log

### Mô tả mục tiêu sử dụng AI

Ứng dụng trí tuệ nhân tạo (Gemini AI & Antigravity) vào hệ thống GreenLife với hai vai trò chính:
1. **AI tích hợp trong sản phẩm (Product AI - Gemini API):** Tự động nhận diện hình ảnh lá cây bị bệnh, phân tích triệu chứng, dự đoán mức độ nghiêm trọng, đối chiếu thông tin mô tả do người dùng cung cấp và đưa ra khuyến nghị điều trị sinh học. Đồng thời thiết lập System Guardrails rào chắn các câu hỏi ngoài phạm vi nông nghiệp.
2. **AI hỗ trợ phát triển (Development AI - Antigravity Agent):** Hỗ trợ thiết kế Full-stack (React/Spring Boot/SQL Server), vá lỗi CSDL migration, tối ưu hóa kích thước ảnh Base64 gửi cho AI để giảm 90% độ trễ và định dạng tự động xuống dòng cho Chatbot UI.

---

## 4. Nhật ký sử dụng AI chi tiết

### Lần sử dụng AI số 1: Tích hợp Dịch vụ Chẩn đoán Bệnh Cây bằng AI (Gemini Provider)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Kích hoạt & cấu hình mô hình AI chẩn đoán bệnh lá cây, tích hợp kết quả nhận diện tự động vào hệ thống GreenLife |
| Phần việc liên quan | Backend / AI Integration / Security |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng
> "Kiểm tra và kích hoạt dịch vụ AI chẩn đoán bệnh lá cây đang bị tắt trong hệ thống GreenLife. Cấu hình Gemini REST API service và các biến môi trường tương ứng trong Spring Boot."

#### 4.2. Kết quả AI gợi ý
> Gợi ý cấu hình biến môi trường `greenlife.ai.enabled=true`, cung cấp API Key mặc định và viết service `GeminiProviderService.java` xử lý kết nối tới Google Generative Language API.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI
> Sử dụng toàn bộ cấu hình thuộc tính trong `application.properties`, `.env` và các hàm kết nối API trong `GeminiProviderService.java`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến
> Bổ sung cơ chế fallback kiểm tra null/blank cho API Key, bọc disclaimer bảo mật mặc định từ phía máy chủ để đảm bảo an toàn thông tin nông nghiệp.

#### 4.5. Minh chứng
| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `f2ea7109d71c78e318282deae10fe2f7c5ca1b72` |
| File liên quan | `GeminiProviderService.java`, `application.properties`, `.env` |
| Kết quả chạy/test | Đã kích hoạt dịch vụ thành công trên cổng 8080 |

#### 4.6. Nhận xét cá nhân/nhóm
> Hiểu rõ hơn về cách tích hợp REST API của Google Gemini vào ứng dụng Spring Boot và quản lý biến môi trường an toàn.

---

### Lần sử dụng AI số 2: Định dạng Tự động Xuống dòng cho Chatbot UI

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/07/2026 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Xử lý giao diện khung chat Chatbot, tự động tách các mục danh sách số (`1. `, `2. `) thành dòng riêng và làm nổi bật màu sắc |
| Phần việc liên quan | Frontend / UX / Backend Prompt Engineering |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng
> "Điều chỉnh giao diện khung trả lời của Chatbot cho rộng hơn. Cấu hình sao cho các câu dạng danh sách (1., 2.,...) tự động xuống dòng rõ ràng. Sau đó tối ưu lại kích thước khung chat sao cho không làm vỡ layout responsive."

#### 4.2. Kết quả AI gợi ý
> Viết hàm xử lý Regex `/([^\n])\s*(\d+\.)\s+/g` trong React để tự động chèn ký tự xuống dòng trước các danh sách có số, đồng thời bổ sung chỉ thị System Instruction cho Chatbot backend.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI
> Sử dụng hàm `renderFormattedText` trong `Chatbot.tsx` và quy tắc #9 trong `ChatService.java`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến
> Giữ nguyên kích thước khung chat chuẩn `380px` để không phá vỡ bố cục Responsive trên các thiết bị di động.

#### 4.5. Minh chứng
| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | `Chatbot.tsx`, `ChatService.java` |
| Kết quả chạy/test | Chatbot hiển thị danh sách câu trả lời chuẩn xác, dễ đọc |

#### 4.6. Nhận xét cá nhân/nhóm
> Học được kỹ thuật phối hợp giữa Prompt Engineering ở Backend và Regex Parser ở Frontend để tối ưu trải nghiệm người dùng (UX).

---

### Lần sử dụng AI số 3: Sửa lỗi Database Migration cho AI Diagnosis

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/07/2026 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Chẩn đoán lỗi `Invalid column name 'alternative_diagnoses'`, tạo và thực thi các bản vá CSDL SQL Server |
| Phần việc liên quan | Database / Debugging |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng
> "Phân tích nguyên nhân và cách khắc phục lỗi SQL Server: 'Invalid column name alternative_diagnoses' khi lưu kết quả chẩn đoán AI vào cơ sở dữ liệu GreenLife."

#### 4.2. Kết quả AI gợi ý
> Xác định bảng `diagnosis_history` bị thiếu các cột chẩn đoán AI do chưa chạy các file patch migration mới. Gợi ý thực thi `patch_21_ai_production_foundation.sql` và `patch_22_financial_ledger_and_manual_promotions.sql`.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI
> Sử dụng công cụ terminal thực thi lệnh `sqlcmd` để vá trực tiếp CSDL SQL Server `GreenLife`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến
> Xác nhận đầy đủ 27 cột dữ liệu cấu trúc chẩn đoán AI sau khi vá để tránh lỗi đứt gãy JPA Entity.

#### 4.5. Minh chứng
| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | `patch_21_ai_production_foundation.sql`, `patch_22_financial_ledger_and_manual_promotions.sql` |
| Kết quả chạy/test | Đã thêm thành công các cột CSDL và lưu dữ liệu chẩn đoán không còn báo lỗi |

#### 4.6. Nhận xét cá nhân/nhóm
> Nâng cao kỹ năng truy vết lỗi CSDL (Database Schema Mismatch) giữa JPA Hibernate và CSDL thực tế.

---

### Lần sử dụng AI số 4: Phát triển Tính năng "Mô tả thêm về cây (tùy chọn)" Full-stack

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Thêm tính năng cho phép người dùng nhập mô tả ngữ cảnh cây trồng (bộ đếm 500 ký tự), gửi kèm request AI, đối chiếu dữ liệu trong AI prompt và lưu trữ CSDL |
| Phần việc liên quan | Requirement / Design / Database / Frontend / Backend / Testing |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng
> "Xây dựng tính năng cho phép người dùng nhập mô tả ngữ cảnh bổ sung về tình trạng cây (tối đa 500 ký tự) trước khi chẩn đoán. Cập nhật đồng bộ từ CSDL, Entity, DTO, Controller, Service ở Backend đến React Hook và UI Frontend."

#### 4.2. Kết quả AI gợi ý
> 1. Tạo SQL Migration Patch `patch_23_add_user_context.sql` bổ sung cột `user_context NVARCHAR(500) NULL`.  
> 2. Thêm thuộc tính `userContext` trong Entity, DTO, Controller, Service của Backend Java.  
> 3. Đưa thông tin `userContext` vào `systemInstruction` của Gemini AI để mô hình đối chiếu nguyên nhân bệnh.  
> 4. Thêm ô `textarea` tùy chọn kèm bộ đếm ký tự (0/500) trên Frontend UI.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI
> Áp dụng toàn bộ thiết kế full-stack từ kế hoạch `implementation_plan.md` do AI tạo.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến
> Giữ nguyên toàn bộ logic chẩn đoán hiện có, hỗ trợ overload phương thức `classify` ở Backend để các Unit Test hiện tại không bị đứt gãy.

#### 4.5. Minh chứng
| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | `patch_23_add_user_context.sql`, `AIDiagnosisView.tsx`, `useDiagnosis.ts`, `aiDiagnosisService.ts`, `DiagnosisController.java`, `DiagnosisService.java`, `DiagnosisHistory.java` |
| Screenshot | Đã chụp và kiểm tra giao diện ô nhập mô tả cây |
| Kết quả chạy/test | Đã test gửi chẩn đoán kèm mô tả và để trống mô tả thành công |

#### 4.6. Nhận xét cá nhân/nhóm
> Hiểu rõ quy trình phát triển tính năng Full-stack từ CSDL, Backend DTO/Service, AI Prompting cho tới Frontend React Hook/View.

---

### Lần sử dụng AI số 5: Tối ưu hóa Hiệu năng & Sửa lỗi Timeout AI (Performance Optimization)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/07/2026 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Khắc phục lỗi `SocketTimeoutException` khi tải ảnh lớn; tự động downscale ảnh Base64 giúp tăng tốc AI từ 20s xuống 2-4s |
| Phần việc liên quan | Backend / Performance Optimization / Network Debugging |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng
> "Phân tích nguyên nhân và xử lý lỗi SocketTimeoutException khi gọi Gemini Vision API với ảnh chụp kích thước lớn. Đề xuất giải pháp nén/downscale ảnh phía backend trước khi gửi payload Base64."

#### 4.2. Kết quả AI gợi ý
> Phân tích log máy chủ, phát hiện ảnh gốc dung lượng lớn làm chậm thời gian xử lý của Gemini API vượt quá 15s. Gợi ý tăng timeout lên `60s` và viết hàm `optimizeImageForAi()` tự động nén/thu nhỏ ảnh > 600KB về tối đa `1024px`.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI
> Sử dụng thuật toán downscale ảnh bằng `BufferedImage` và `Graphics2D` trong `GeminiProviderService.java`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến
> Giữ nguyên chất lượng ảnh gốc trên đĩa cứng để phục vụ lưu trữ, chỉ downscale bản sao dữ liệu Base64 truyền cho AI API để tối ưu băng thông.

#### 4.5. Minh chứng
| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | `GeminiProviderService.java`, `application.properties`, `.env` |
| Kết quả chạy/test | Giảm 90% dung lượng payload Base64 (từ ~7MB xuống ~150KB), thời gian phản hồi AI còn 2-4s |

#### 4.6. Nhận xét cá nhân/nhóm
> Học được kỹ thuật tối ưu hóa hiệu năng (Performance Optimization) cho các ứng dụng tích hợp AI đa phương thức (Multimodal Vision AI).

---

### Lần sử dụng AI số 6: Cấu hình Rào chắn Phạm vi Domain (Domain Guardrails & Safety Prompting)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Thiết lập quy tắc System Instruction giới hạn Chatbot & Chẩn đoán AI chỉ trả lời các chủ đề liên quan đến nông nghiệp, cây trồng và bảo vệ thực vật |
| Phần việc liên quan | Backend / Security / Prompt Engineering |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng
> "Viết quy tắc System Instruction cho Gemini Chatbot để giới hạn AI chỉ tư vấn về nông nghiệp, chăm sóc cây cảnh, bệnh cây trồng và sản phẩm của GreenLife. Nếu người dùng hỏi chủ đề ngoài phạm vi (chính trị, lập trình, giải trí,...), AI phải từ chối lịch sự và hướng người dùng quay lại chủ đề nông nghiệp."

#### 4.2. Kết quả AI gợi ý
> Xây dựng bộ quy tắc Strict System Guardrails trong `ChatService.java` và `GeminiProviderService.java`:
> 1. Định danh rõ vai trò chuyên gia Chăm sóc Cây trồng GreenLife.
> 2. Đưa ra danh sách chủ đề hợp lệ (Cho phép) và không hợp lệ (Cấm).
> 3. Mẫu câu trả lời từ chối chuẩn mực, lịch sự.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI
> Đưa toàn bộ cấu trúc System Prompt vào cấu hình `Gemini` API call trong `ChatService.java`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến
> Bổ sung từ khóa nhận diện các sản phẩm vật tư nông nghiệp (phân bón, đất trồng, hạt giống) có sẵn trong cơ sở dữ liệu GreenLife để AI gợi ý mua hàng chính xác.

#### 4.5. Minh chứng
| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | `ChatService.java`, `GeminiProviderService.java` |
| Kết quả chạy/test | Thử nghiệm hỏi về 'Lập trình Java', AI phản hồi: 'Tôi là trợ lý nông nghiệp GreenLife, tôi chỉ có thể hỗ trợ bạn các vấn đề về chăm sóc cây trồng...' |

#### 4.6. Nhận xét cá nhân/nhóm
> Hiểu rõ tầm quan trọng của Guardrails và Safety System Instructions trong việc ngăn ngừa rủi ro Prompt Injection và giữ nguyên giá trị cốt lõi của ứng dụng chuyên ngành.

---

### Lần sử dụng AI số 7: Chuẩn hóa Cấu trúc Form Trả lời Chẩn đoán Bệnh (Structured Output Prompting)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/07/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Ép AI chẩn đoán phản hồi theo định dạng cấu trúc chuẩn (Tên bệnh, Triệu chứng, Mức độ nguy hiểm, Biện pháp sinh học) |
| Phần việc liên quan | Backend / AI Architecture / Frontend Integration |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng
> "Thiết kế Prompt chỉ thị cấu trúc đầu ra (Structured Output) cho AI Chẩn đoán Bệnh Lá Cây. Dữ liệu trả về phải tuân theo cấu trúc phân định rõ ràng các mục: 1. Tên bệnh & Tác nhân; 2. Triệu chứng nhận biết; 3. Mức độ nghiêm trọng; 4. Giải pháp xử lý sinh học. Định dạng phải tương thích với Component hiển thị ở Frontend."

#### 4.2. Kết quả AI gợi ý
> Xây dựng Mẫu Prompting định hình cấu trúc dữ liệu trả về cho `GeminiProviderService.java`, đảm bảo các thẻ tiêu đề và phân đoạn rõ ràng để Frontend React dễ dàng parse và hiển thị lên giao diện `AIDiagnosisView.tsx`.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI
> Áp dụng mẫu Prompt định dạng vào lớp `GeminiProviderService.java`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến
> Bổ sung điều kiện bắt buộc AI phải đưa ra ít nhất 1 biện pháp xử lý sinh học an toàn cho môi trường trước khi đề xuất thuốc bảo vệ thực vật hóa học.

#### 4.5. Minh chứng
| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | `GeminiProviderService.java`, `AIDiagnosisView.tsx` |
| Kết quả chạy/test | Màn hình kết quả chẩn đoán hiển thị đẹp mắt, phân chia rõ ràng từng phần theo đúng thiết kế |

#### 4.6. Nhận xét cá nhân/nhóm
> Làm chủ kỹ thuật Structured Prompting giúp dữ liệu từ Large Language Model (LLM) tích hợp mượt mà vào giao diện ứng dụng web.

---

## 5. Bảng tổng hợp mức độ sử dụng AI

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  | X |  |  | AI hỗ trợ gợi ý ý tưởng tính năng |
| Viết user story/use case |  | X |  |  |  |
| Thiết kế database |  |  | X |  | AI hỗ trợ viết bản vá SQL Migration |
| Thiết kế kiến trúc hệ thống |  | X |  |  |  |
| Thiết kế giao diện |  |  | X |  | AI gợi ý UI/UX Chatbot và ô nhập ngữ cảnh |
| Code frontend |  |  | X |  | Tối ưu React Hook, Regex Parser và View |
| Code backend |  |  | X |  | Tích hợp Gemini REST API, nén ảnh Base64 |
| Debug lỗi |  |  | X |  | Vá lỗi CSDL SQL Server & Timeout Socket |
| Tối ưu code & Hiệu năng |  |  | X |  | Downscale ảnh giảm latency từ 20s xuống 2s |
| Bảo mật & Rào chắn AI |  |  | X |  | Thiết lập System Guardrails giới hạn Domain |
| Kiểm thử sản phẩm |  | X |  |  | Thực hiện test thủ công các trường hợp AI |
| Viết báo cáo / AI Audit Log |  |  | X |  | AI hỗ trợ tổng hợp nhật ký sử dụng |

---

## 6. Các lỗi hoặc hạn chế từ AI

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | Lỗi Timeout do payload ảnh gốc truyền qua Base64 quá lớn (>7MB) | Theo dõi log máy chủ xuất hiện `SocketTimeoutException` khi gọi API | Viết hàm `optimizeImageForAi()` downscale ảnh về tối đa 1024px trước khi gửi |
| 2 | Lỗi CSDL `Invalid column name` khi JPA Entity không khớp với Database | Server báo lỗi 500 khi lưu lịch sử chẩn đoán | Cho AI kiểm tra schema và thực thi bản vá SQL Migration bổ sung cột thiếu |
| 3 | Chatbot trả về văn bản liền khối, các câu danh sách không xuống dòng | Kiểm tra giao diện người dùng (UI) khung chat | Dùng Regex Parser ở Frontend kết hợp System Instruction ở Backend để ngắt dòng |
| 4 | AI có thể trả lời các câu hỏi ngoài ngành nếu không có rào chắn | Thử nghiệm hỏi các câu hỏi về lập trình, giải trí | Thiết lập System Guardrails khắt khe buộc AI từ chối các câu hỏi ngoài Nông nghiệp |

---

## 7. Kiểm chứng kết quả AI

### Nội dung kiểm chứng

Sinh viên kiểm chứng các kết quả do AI gợi ý theo các bước sau:

1. Đối chiếu kết quả với các yêu cầu của môn học SWP391 và phạm vi chức năng GreenLife.
2. Đọc và hiểu rõ luồng xử lý code do AI sinh ra trước khi đưa vào hệ thống.
3. Chạy kiểm thử trên môi trường Local (Spring Boot + ReactJS + SQL Server).
4. Kiểm tra dữ liệu trong CSDL SQL Server sau khi gọi tính năng AI để đảm bảo tính toàn vẹn dữ liệu.
5. Kiểm tra thời gian phản hồi (Latency) và dung lượng Network payload khi nén ảnh.
6. Thử nghiệm các kịch bản Prompt Injection hoặc hỏi lệch chủ đề để xác nhận rào chắn bảo mật (Guardrails) hoạt động tốt.

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Sinh viên Nguyễn Thanh Hoàng trực tiếp chịu trách nhiệm phát triển phần Frontend và Tích hợp dịch vụ AI cho dự án GreenLife, bao gồm:
- Tích hợp Gemini Vision API chẩn đoán bệnh lá cây.
- Xây dựng giao diện Chatbot tư vấn nông nghiệp và xử lý hiển thị định dạng tin nhắn.
- Tối ưu hóa hiệu năng truyền nén dữ liệu Base64 giúp hệ thống chạy mượt mà.
- Thiết lập System Guardrails và Form phản hồi chuẩn cho AI.
- Cấu hình và sửa lỗi Full-stack từ CSDL SQL Server đến giao diện React.

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Nguyễn Thanh Hoàng | DE190354 | Frontend, Tích hợp Gemini AI, Tối ưu hiệu năng, AI Guardrails | Có | Commit history, Source code Frontend/AI, Patch SQL, Audit Log |
| [Bổ sung thành viên 2] | [MSSV] | [Nhiệm vụ] | Có / Không | [Commit/Jira/file] |
| [Bổ sung thành viên 3] | [MSSV] | [Nhiệm vụ] | Có / Không | [Commit/Jira/file] |
| [Bổ sung thành viên 4] | [MSSV] | [Nhiệm vụ] | Có / Không | [Commit/Jira/file] |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em ở điểm nào?
AI đóng vai trò như một trợ lý lập trình chuyên nghiệp (Antigravity Agent), giúp em tăng tốc độ thiết kế tính năng Full-stack, phát hiện nhanh các lỗi tương thích CSDL, hỗ trợ viết thuật toán nén ảnh tối ưu băng thông và thiết lập rào chắn AI an toàn.

### 9.2. Phần nào em không sử dụng theo gợi ý của AI? Vì sao?
Em không sử dụng gợi ý thay đổi kích thước quá lớn của khung chat vì sẽ làm vỡ giao diện trên thiết bị di động. Ngoài ra, em giữ nguyên ảnh gốc lưu trữ trên đĩa thay vì ghi đè bằng ảnh đã downscale để đảm bảo độ phân giải cho việc tra cứu sau này.

### 9.3. Em đã kiểm tra tính đúng đắn của kết quả AI như thế nào?
Em thực hiện kiểm thử thủ công trực tiếp trên giao diện, kiểm tra log hệ thống, theo dõi thời gian phản hồi trong Network Tab, kiểm tra các bản ghi trong SQL Server và thử nghiệm gửi các câu hỏi ngoài phạm vi để kiểm tra rào chắn AI.

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?
Phần khó khăn nhất sẽ là việc tối ưu hóa hiệu năng truyền ảnh đa phương thức (Vision AI) và việc truy vết lỗi lệch cấu hình CSDL giữa JPA Entity và SQL Server, vốn tốn rất nhiều thời gian nếu tìm kiếm theo cách truyền thống.

### 9.5. Sau bài tập/project này, em học được gì về môn học?
Em nắm vững quy trình phát triển một dự án phần mềm thực tế, từ việc thiết kế CSDL, xây dựng API Backend, phát triển giao diện Frontend ReactJS cho đến tích hợp các công cụ AI tiên tiến vào sản phẩm.

### 9.6. Sau bài tập/project này, em học được gì về cách sử dụng AI có trách nhiệm?
Em hiểu rằng AI là một công cụ hỗ trợ mạnh mẽ nhưng cần được kiểm soát chặt chẽ thông qua các rào chắn (Guardrails), System Instructions và việc kiểm thử lại toàn bộ code do AI sinh ra trước khi đưa vào sản phẩm chính thức.

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
| Nguyễn Thanh Hoàng | 24/07/2026 |