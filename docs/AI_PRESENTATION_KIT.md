# Bộ Kit Thuyết Trình Tính Năng AI - GreenLife

Tài liệu này gom mọi thứ cần để **thuyết trình / demo / trả lời phản biện** về phần AI, dùng chung với [AI_FEATURE_GUIDE.md](./AI_FEATURE_GUIDE.md) (giải thích chi tiết cách hoạt động).

Mục lục:
1. Dàn ý slide (copy vào PowerPoint)
2. Kịch bản demo trực tiếp (từng bước bấm)
3. Talking points (câu nói mẫu khi trình bày)
4. Q&A - câu hỏi phản biện & cách trả lời
5. So sánh Mock vs AI thật + lộ trình nâng cấp
6. Hạn chế đã biết (nói trước để ghi điểm trung thực)
7. Nội dung sẵn để dán vào docs audit

---

## 1. Dàn ý slide

| Slide | Tiêu đề | Nội dung chính |
|---|---|---|
| 1 | Tổng quan AI trong GreenLife | 2 tính năng: Bác Sĩ Cây AI (chẩn đoán bệnh lá) + Chatbot trợ lý |
| 2 | Bài toán & giá trị | Người trồng cây khó tự chẩn bệnh → chụp ảnh lá là ra bệnh + phác đồ + gợi ý sản phẩm |
| 3 | Luồng hoạt động end-to-end | Sơ đồ: Upload → API → Service → Lõi AI → DB → Hiển thị |
| 4 | Kiến trúc "cắm nóng" (pluggable) | `PlantDiseaseClassifier` là interface; hiện dùng `MockPlantDiseaseClassifier`; thay AI thật không đổi luồng |
| 5 | Cách AI bị "rào" an toàn | Khuôn `DiagnosisResult`, enum `severity`, phân quyền, hạn mức 20/ngày & 200 ảnh |
| 6 | Chatbot | 5 câu gợi ý trả lời local + câu tự do gọi `/api/ai/chat` |
| 7 | Demo trực tiếp | (chuyển sang app) |
| 8 | Hạn chế & lộ trình | Mock → model thật (Gemini/CNN), bật chatbot, cải thiện gợi ý sản phẩm |
| 9 | Sử dụng AI có trách nhiệm | Ghi log audit, kiểm chứng, tự chịu trách nhiệm |

---

## 2. Kịch bản demo trực tiếp

Chuẩn bị trước: backend chạy `http://localhost:8080`, frontend `http://localhost:3000`, đăng nhập tài khoản **CUSTOMER**.

### Demo A - Bác Sĩ Cây AI (tính năng chạy thật)

1. Vào trang **"Chẩn Đoán Bệnh Cây AI"**.
2. Nói: *"Người dùng có 2 lựa chọn: tải ảnh lá của mình, hoặc chọn ca bệnh mẫu."*
3. Chọn 1 preset, ví dụ **"Cà chua bị mốc sương (Phytophthora infestans)"**.
4. Bấm **"Đặt Lệnh Chẩn Đoán AI"** → chỉ hiệu ứng quét.
5. Khi ra kết quả, chỉ vào từng phần: **tên bệnh, mức độ (badge màu), triệu chứng, phác đồ điều trị**.
6. Mở phần **"Lịch Sử Đã Khám Bệnh"** → bấm "Mở lại hồ sơ" để chứng minh dữ liệu được lưu DB.

> Lưu ý trung thực khi demo: tầng phân loại đang là **mock** nên mọi ảnh đều ra "Bệnh héo rũ (Fusarium Wilt) - 94.85%". Hãy nói thẳng đây là bản mô phỏng để hoàn thiện luồng; điểm mạnh là kiến trúc đã sẵn sàng cắm model thật.

### Demo B - Chatbot (tùy chọn)

1. Chatbot mặc định **tắt** (`chatbotBackendSupported = false` trong `Chatbot.tsx`). Muốn demo, đổi thành `true` và chạy lại frontend.
2. Mở khung chat, bấm 1 câu gợi ý (VD: *"AI chẩn đoán cây hoạt động thế nào?"*) → bot trả lời ngay (local).
3. Nói rõ: câu tự do sẽ gọi `POST /api/ai/chat` — endpoint này **chưa được cài ở backend**, nên sẽ hiện thông báo lỗi thân thiện.

### Demo C - Kiểm chứng qua API (cho phản biện kỹ thuật)

- Mở DevTools → tab Network → thực hiện 1 lần chẩn đoán → chỉ request `POST /api/diagnoses` (multipart) và response JSON `DiagnosisResponse`.

---

## 3. Talking points (câu nói mẫu)

- *"AI của tụi em nằm sau một interface duy nhất tên `PlantDiseaseClassifier`. Toàn bộ hệ thống chỉ phụ thuộc vào interface này, nên việc thay bản mô phỏng bằng model thật không ảnh hưởng tới controller, service hay frontend."*
- *"Điểm quan trọng là AI bị rào theo một khuôn dữ liệu cố định `DiagnosisResult`. AI không thể trả lời tự do — mọi kết quả buộc phải có tên bệnh, độ tin cậy, mức độ (enum), triệu chứng và phác đồ. Nhờ vậy giao diện luôn hiển thị nhất quán và an toàn."*
- *"Về bảo mật: chỉ CUSTOMER được chẩn đoán, mỗi hồ sơ chỉ chủ sở hữu hoặc ADMIN xem được (chống IDOR), và có hạn mức 20 lượt/ngày, 200 ảnh/người để chống lạm dụng."*
- *"Chatbot dùng chiến lược lai: câu thường gặp trả lời tức thì bằng nội dung soạn sẵn, câu phức tạp mới đẩy sang AI backend."*

---

## 4. Q&A - câu hỏi phản biện & cách trả lời

| Câu hỏi có thể bị hỏi | Trả lời gợi ý |
|---|---|
| AI này là model gì, train ra sao? | Hiện tầng phân loại là **mock** để hoàn thiện luồng end-to-end. Kiến trúc đã tách qua interface `PlantDiseaseClassifier`, nên chỉ cần bổ sung một lớp gọi model thật (Gemini Vision / CNN) là chạy, không sửa phần còn lại. |
| Vì sao ảnh nào cũng ra một bệnh? | Vì `MockPlantDiseaseClassifier` trả về kết quả cố định. Đây là chủ đích cho bản mô phỏng; phần "thông minh" nằm ở nơi có thể thay thế được. |
| Làm sao đảm bảo AI không trả lời bậy? | Ràng buộc bằng khuôn `DiagnosisResult` + enum `Severity`; frontend chỉ map các trường hợp lệ; chatbot giới hạn chủ đề và định dạng hiển thị. |
| Dữ liệu ảnh người dùng có an toàn không? | Ảnh lưu qua `FileStorageService`; khi xóa (purge) có ghi **security audit**; xem chi tiết bị chặn IDOR; có hạn mức lưu trữ. |
| Chatbot đã hoạt động chưa? | Giao diện xong, có cơ chế trả lời local cho câu thường gặp. Endpoint AI backend `/api/ai/chat` là phần mở rộng chưa hoàn thiện, đang tắt bằng cờ cấu hình. |
| Gợi ý sản phẩm dựa trên gì? | Frontend suy luận theo từ khóa tên bệnh (mốc sương→prod-5, thối/sen đá→prod-2, ...). Đây là luật đơn giản, sẽ thay bằng mapping từ backend sau. |
| Nếu mất mạng/backend lỗi thì sao? | Frontend bắt lỗi, hiện toast/thông báo thân thiện, hỗ trợ hủy request đang chạy (AbortController). |

---

## 5. So sánh Mock vs AI thật + lộ trình

| Tiêu chí | Hiện tại (Mock) | Nâng cấp (AI thật) |
|---|---|---|
| Lõi phân loại | `MockPlantDiseaseClassifier` trả kết quả cố định | Lớp mới `implements PlantDiseaseClassifier` gọi model ảnh (Gemini Vision, hoặc CNN tự train) |
| Độ chính xác | Không (mô phỏng) | Phụ thuộc model & dataset |
| Phần code phải sửa | — | Chỉ thêm 1 lớp + cấu hình bean; controller/service/frontend giữ nguyên |
| Chatbot | Trả lời local + endpoint chưa có | Cài `POST /api/ai/chat` gọi LLM, bật cờ `chatbotBackendSupported = true` |
| Gợi ý sản phẩm | Luật từ khóa ở frontend | Mapping bệnh → sản phẩm từ backend |

Các bước nâng cấp gợi ý (nói ở slide "lộ trình"):
1. Chọn nhà cung cấp AI (VD Gemini) + thêm khóa API vào `.env.example` (không commit khóa thật).
2. Viết lớp classifier thật, đặt `@Primary` để thay mock.
3. Cài endpoint chatbot backend, bật cờ frontend.
4. Đưa mapping gợi ý sản phẩm về backend.

---

## 6. Hạn chế đã biết (nên chủ động nói)

- Tầng phân loại là **mock**, chưa phải AI suy luận thật.
- Vì mock luôn trả "Fusarium Wilt", nên **luật gợi ý sản phẩm ở frontend hiện không khớp** (các từ khóa "mốc sương/thối/trĩ" không xuất hiện) → thực tế chưa hiện sản phẩm gợi ý. Đây là điểm sẽ khớp lại khi có model thật hoặc khi map lại từ khóa.
- Chatbot **đang tắt** và endpoint `/api/ai/chat` **chưa có backend**.
- Thư mục `ai-module/` được nhắc trong README nhưng **chưa tồn tại** trong repo.

> Việc nêu trước hạn chế thể hiện hiểu hệ thống và tính trung thực — thường được đánh giá cao hơn là giấu.

---

## 7. Nội dung sẵn để dán vào docs audit

Dưới đây là nội dung **factual** liên quan tính năng AI, nhóm có thể dán vào các file audit (nhớ tự điền ngày, MSSV, link commit thật).

### 7.1. Dán vào `docs/AI_AUDIT_LOG.md` (mục "Mô tả mục tiêu sử dụng AI")

```text
Nhóm sử dụng AI (Cursor/ChatGPT/Gemini) để hỗ trợ thiết kế và hoàn thiện tính năng
"Bác Sĩ Cây AI" (chẩn đoán bệnh lá cây) và Chatbot trợ lý. Cụ thể: thiết kế luồng
upload ảnh -> API /api/diagnoses -> service kiểm tra hạn mức -> lõi phân loại
(PlantDiseaseClassifier) -> lưu lịch sử -> hiển thị bệnh án; thiết kế khuôn dữ liệu
DiagnosisResult để ràng buộc đầu ra của AI; và viết tài liệu mô tả tính năng cho nhóm.
```

### 7.2. Dán vào `docs/PROMPTS.md` (một dòng trong bảng tổng hợp)

```text
| 1 | <ngày> | Cursor | Viết tài liệu giải thích tính năng AI cho nhóm | "Giải thích cách hoạt động, cách rào form trả lời và luồng của tính năng AI trong repo" | Sinh ra AI_FEATURE_GUIDE.md + AI_PRESENTATION_KIT.md | Có | docs/AI_FEATURE_GUIDE.md |
```

### 7.3. Dán vào `docs/REFLECTION.md` (mục "Phần đóng góp thật sự")

```text
Nhóm tự thiết kế kiến trúc tách interface PlantDiseaseClassifier để có thể thay
bản mô phỏng bằng AI thật mà không sửa phần còn lại; tự đặt ra các ràng buộc an toàn
(khuôn DiagnosisResult, enum Severity, phân quyền CUSTOMER/ADMIN, hạn mức 20 lượt/ngày
và 200 ảnh). AI chỉ hỗ trợ gợi ý và viết tài liệu; nhóm kiểm chứng bằng cách chạy thử
luồng chẩn đoán và kiểm tra request/response trên DevTools.
```

### 7.4. Dán vào `docs/CHANGELOG.md` (Phase 04 - Implementation, mục "AI có hỗ trợ")

```text
Có. AI hỗ trợ viết tài liệu mô tả tính năng AI (AI_FEATURE_GUIDE.md) và bộ kit
thuyết trình (AI_PRESENTATION_KIT.md). Phần code chẩn đoán bệnh cây do nhóm tự
thiết kế và kiểm thử.
```
