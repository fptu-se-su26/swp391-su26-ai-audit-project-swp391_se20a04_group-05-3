CREATE DATABASE GreenLife;
GO
USE GreenLife;
GO
-- Người dùng
CREATE TABLE users (
  id         INT PRIMARY KEY IDENTITY(1,1),
  name       NVARCHAR(100),
  email      NVARCHAR(100) UNIQUE,
  password   NVARCHAR(255),
  phone      NVARCHAR(20),
  address    NVARCHAR(MAX),
  role       NVARCHAR(10) DEFAULT 'customer',  -- 'customer' | 'admin'
  created_at DATETIME DEFAULT GETDATE()
);

-- Nhóm cây (trong nhà, ngoài trời, thuỷ sinh, bonsai)
CREATE TABLE plant_groups (
  id   INT PRIMARY KEY IDENTITY(1,1),
  name NVARCHAR(100)
);

-- Danh mục loại cây (cây mini, cây treo, cây ăn quả...)
CREATE TABLE plant_categories (
  id             INT PRIMARY KEY IDENTITY(1,1),
  plant_group_id INT FOREIGN KEY REFERENCES plant_groups(id),
  name           NVARCHAR(100)
);

-- Danh mục phụ kiện (chậu, đất, phân, dụng cụ)
CREATE TABLE accessory_categories (
  id   INT PRIMARY KEY IDENTITY(1,1),
  name NVARCHAR(100)
);

-- Sản phẩm (cây + phụ kiện dùng chung)
CREATE TABLE products (
  id                    INT PRIMARY KEY IDENTITY(1,1),
  name                  NVARCHAR(150),
  type                  NVARCHAR(10),        -- 'plant' | 'accessory'
  plant_category_id     INT NULL FOREIGN KEY REFERENCES plant_categories(id),
  accessory_category_id INT NULL FOREIGN KEY REFERENCES accessory_categories(id),
  price                 DECIMAL(12,0),
  stock                 INT DEFAULT 0,
  image_url             NVARCHAR(255),
  description           NVARCHAR(MAX)
);

-- Giỏ hàng
CREATE TABLE cart (
  id         INT PRIMARY KEY IDENTITY(1,1),
  user_id    INT FOREIGN KEY REFERENCES users(id),
  product_id INT FOREIGN KEY REFERENCES products(id),
  quantity   INT DEFAULT 1
);

-- Đơn hàng
CREATE TABLE orders (
  id             INT PRIMARY KEY IDENTITY(1,1),
  user_id        INT FOREIGN KEY REFERENCES users(id),
  total_price    DECIMAL(12,0),
  payment_method NVARCHAR(20),   -- 'COD' | 'bank_transfer' | 'momo'
  status         NVARCHAR(20) DEFAULT 'pending',
  created_at     DATETIME DEFAULT GETDATE()
);

-- Chi tiết đơn hàng
CREATE TABLE order_items (
  id         INT PRIMARY KEY IDENTITY(1,1),
  order_id   INT FOREIGN KEY REFERENCES orders(id),
  product_id INT FOREIGN KEY REFERENCES products(id),
  quantity   INT,
  unit_price DECIMAL(12,0)
);

-- Bài viết cẩm nang
CREATE TABLE articles (
  id           INT PRIMARY KEY IDENTITY(1,1),
  author_name  NVARCHAR(100) NOT NULL, -- tên tác giả
  title        NVARCHAR(250) NOT NULL,
  category     NVARCHAR(50),      -- loại bài viết
  summary      NVARCHAR(500),     -- Đoạn mô tả ngắn
  content      NVARCHAR(MAX),     -- Nội dung chi tiết bài viết
  image_url    NVARCHAR(255),
  reading_time INT DEFAULT 5,   
  created_at   DATE DEFAULT GETDATE()
);
-- Feedback / liên hệ
CREATE TABLE feedbacks (
  id         INT PRIMARY KEY IDENTITY(1,1),
  user_id    INT NULL FOREIGN KEY REFERENCES users(id),
  name       NVARCHAR(100),
  email      NVARCHAR(100),
  message    NVARCHAR(MAX),
  created_at DATETIME DEFAULT GETDATE()
);
-- nhập dữ liệu 
INSERT INTO plant_groups (name) VALUES
(N'Cây trong nhà'),
(N'Cây ngoài trời'),
(N'Cây thuỷ sinh'),
(N'Bonsai');
--
INSERT INTO plant_categories (plant_group_id, name) VALUES
(1, N'Cây mini để bàn'),
(1, N'Cây treo'),
(1, N'Cây lọc không khí'),
(2, N'Cây bóng mát'),
(2, N'Cây ăn quả'),
(2, N'Cây hoa'),
(3, N'Cây thuỷ sinh nhỏ'),
(3, N'Rêu thuỷ sinh'),
(4, N'Bonsai cổ thụ'),
(4, N'Bonsai mini');
--
INSERT INTO accessory_categories (name) VALUES
(N'Chậu cây'),
(N'Loại đất'),
(N'Phân bón'),
(N'Dụng cụ làm vườn');
--
INSERT INTO products (name, type, plant_category_id, accessory_category_id, price, stock, image_url, description) VALUES
(N'Cây Kim Tiền', 'plant', 1, NULL, 85000, 50, 'kim-tien.jpg', N'Cây phong thuỷ, dễ chăm, hợp để bàn làm việc'),
(N'Cây Lưỡi Hổ', 'plant', 3, NULL, 120000, 40, 'luoi-ho.jpg', N'Cây lọc không khí tốt, chịu bóng râm'),
(N'Cây Trầu Bà', 'plant', 2, NULL, 65000, 60, 'trau-ba.jpg', N'Cây leo, dễ trồng, thích hợp treo ban công'),
(N'Cây Phát Tài', 'plant', 1, NULL, 150000, 30, 'phat-tai.jpg', N'Cây phong thuỷ mang lại may mắn tài lộc'),
(N'Cây Hoa Lan Hồ Điệp', 'plant', 6, NULL, 250000, 20, 'lan-ho-diep.jpg', N'Hoa đẹp, sang trọng, thích hợp làm quà tặng'),
(N'Cây Xương Rồng Mini', 'plant', 1, NULL, 35000, 100, 'xuong-rong.jpg', N'Cây nhỏ xinh, ít cần tưới nước'),
(N'Cây Bàng Singapore', 'plant', 4, NULL, 320000, 15, 'bang-singapore.jpg', N'Cây bóng mát, thân gỗ đẹp'),
(N'Rêu Thuỷ Sinh Java', 'plant', 8, NULL, 45000, 80, 'reu-java.jpg', N'Rêu xanh mướt, phù hợp bể thuỷ sinh'),
(N'Bonsai Sanh Mini', 'plant', 10, NULL, 450000, 10, 'bonsai-sanh.jpg', N'Bonsai mini nghệ thuật, dáng cổ thụ'),
(N'Cây Chuối Cảnh', 'plant', 4, NULL, 180000, 25, 'chuoi-canh.jpg', N'Cây ngoài trời, lá rộng tạo bóng mát'),
-- Phụ kiện
(N'Chậu Nhựa Tròn 15cm', 'accessory', NULL, 1, 25000, 200, 'chau-nhua-15.jpg', N'Chậu nhựa màu trắng, đường kính 15cm'),
(N'Chậu Gốm Vuông 20cm', 'accessory', NULL, 1, 75000, 80, 'chau-gom-20.jpg', N'Chậu gốm men trắng sang trọng'),
(N'Chậu Treo Macrame', 'accessory', NULL, 1, 55000, 60, 'chau-treo.jpg', N'Chậu treo thủ công bằng dây thừng'),
(N'Đất Trồng Cây Đa Năng 5L', 'accessory', NULL, 2, 45000, 150, 'dat-trong.jpg', N'Đất sạch, tơi xốp, phù hợp mọi loại cây'),
(N'Đất Than Bùn Chuyên Dùng', 'accessory', NULL, 2, 60000, 100, 'than-bun.jpg', N'Giữ ẩm tốt, giàu dinh dưỡng'),
(N'Phân Bón Lá NPK', 'accessory', NULL, 3, 38000, 120, 'phan-npk.jpg', N'Phân bón lá giúp cây xanh tốt nhanh'),
(N'Phân Hữu Cơ Vi Sinh', 'accessory', NULL, 3, 52000, 90, 'phan-huu-co.jpg', N'An toàn, thân thiện môi trường'),
(N'Bình Tưới Cây 1L', 'accessory', NULL, 4, 42000, 70, 'binh-tuoi.jpg', N'Bình tưới nhỏ gọn, vòi dài tiện dụng'),
(N'Kéo Cắt Tỉa Cây', 'accessory', NULL, 4, 68000, 50, 'keo-cat.jpg', N'Kéo inox chắc chắn, cắt sắc bén'),
(N'Xẻng Trồng Cây Mini', 'accessory', NULL, 4, 32000, 85, 'xeng-mini.jpg', N'Bộ xẻng nhỏ tiện làm vườn ban công');
-- 
INSERT INTO users (name, email, password, phone, address, role) VALUES
(N'Admin GreenLife', 'admin@greenlife.vn', 'admin123', '0901234567', N'123 Lê Lợi, Hải Phòng', 'admin'),
(N'Nguyễn Thị Lan ', 'lan.nguyen@gmail.com', 'pass1234', '0912345678', N'45 Trần Phú, Hải Phòng', 'customer'),
(N'Trần Văn Minh', 'minh.tran@gmail.com', 'pass1234', '0923456789', N'78 Lý Thường Kiệt, Hà Nội', 'customer'),
(N'Phạm Thị Hoa', 'hoa.pham@gmail.com', 'pass1234', '0934567890', N'12 Nguyễn Huệ, TP.HCM', 'customer'),
(N'Lê Văn Tùng', 'tung.le@gmail.com', 'pass1234', '0945678901', N'56 Điện Biên Phủ, Đà Nẵng', 'customer');
--
INSERT INTO orders (user_id, total_price, payment_method, status) VALUES
(2, 205000, 'COD', 'delivered'),
(3, 370000, 'bank_transfer', 'shipping'),
(4, 120000, 'momo', 'confirmed'),
(5, 500000, 'COD', 'pending');
--
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 85000),   -- Cây Kim Tiền
(1, 14, 1, 45000),  -- Đất trồng
(1, 18, 1, 42000),  -- Bình tưới
(1, 16, 1, 38000),  -- Phân NPK
(2, 9, 1, 450000),  -- Bonsai Sanh
(2, 12, 1, 75000),  -- Chậu gốm
(3, 2, 1, 120000),  -- Cây Lưỡi Hổ
(4, 5, 1, 250000),  -- Lan Hồ Điệp
(4, 12, 1, 75000),  -- Chậu gốm
(4, 17, 1, 52000);  -- Phân hữu cơ
-- 
INSERT INTO articles (title, category, summary, content, image_url, reading_time, created_at) VALUES

-- Danh mục: Nông Nghiệp Đô Thị (nong_nghiep_do_thi)


(
  N'Top loại thảo mộc cực dễ trồng chịu bóng râm tốt cho nhà phố', 
  'nong_nghiep_do_thi', 
  N'Bật mí danh sách các loại cây gia vị vừa làm gia vị món ăn vừa giúp thanh lọc không khí, đuổi muỗi hiệu quả mà không cần nhiều nắng.', 
  N'Bạc hà (mint) — dễ nhất cho người mới. Rất phù hợp để trông ở nhà phố vì chỉ cần ánh sáng gián tiếp là có thể sống được, mùi thơm mát và có thể đuổi được côn trùng nhẹ.Lưu ý: tưới ngày 1 lần sáng sớm, cắt ngọn thường xuyên để cây bụi hơn. Được dùng để pha trà bạc hà hoặc ăn kèm với bún.
  Húng quế — thơm, đa dụng. Thích ánh nắng nhẹ vào buổi sớm, chịu được bóng râm tốt. Lưu ý: không được để cây úng nước và phải thường xuyên bấm tỉa. Dùng để ăn kèm các loại rau thơm.
  Tía tô — rất hợp khí hậu nước ta. Chịu được bóm râm tốt, ít sâu bệnh, lá mọc nhanh. Lưu ý: tưới nước mỗi ngày 1 lần. Dùng để làm thuốc giải cảm rất tốt', 
  'thao-moc-nha-pho.jpg', 4, '2026-05-22'
),

-- Danh mục: Sống Xanh Thượng Lưu (song_xanh)
(
  N'Bí mật đằng sau ''Eco-Score'' và lối sống giảm thiểu dấu chân Carbon', 
  'song_xanh', 
  N'Đọc vị các con số tác động sinh thái trên dòng sản phẩm GreenLife và cách lựa chọn thông minh để góp phần bảo vệ hành tinh xanh...', 
  N'Bài viết phân tích sâu về khái niệm dấu chân carbon của từng loại cây trồng, quy trình đóng gói bằng vật liệu tự hủy sinh học và cách ứng dụng tiêu chuẩn Eco-Score vào mua sắm.', 
  'eco-score-secret.jpg', 8, '2026-05-18'
),
(
  N'Nghệ thuật bài trí cây phong thủy Biophilic Design trong căn hộ Penthouse', 
  'song_xanh', 
  N'Đưa thiên nhiên nguyên bản vào kiến trúc cao cấp nhằm tối ưu dòng chảy năng lượng thịnh vượng và nâng tầm trải nghiệm sống xa xỉ.', 
  N'Cách kết hợp các mảng tường rêu tự nhiên, vị trí đặt các chậu Bonsai dáng đại thế vững chãi tại phòng khách và kỹ thuật giấu đèn quang phổ giả lập ánh sáng mặt trời.', 
  'biophilic-penthouse.jpg', 9, '2026-05-25'
),
(
  N'Liệu pháp Tắm Rừng (Shinrin-yoku) ngay tại không gian sân vườn gia đình', 
  'song_xanh', 
  N'Khám phá phương pháp chữa lành tâm hồn, giảm cortisol căng thẳng bằng cách kết nối các giác quan với hệ thực vật phong phú tại gia.', 
  N'Hướng dẫn cách quy hoạch một góc vườn thiền với âm thanh nước chảy, các tầng cây tạo ion âm như tùng bách, dương xỉ để tối ưu hóa không gian tĩnh tâm.', 
  'shinrin-yoku-home.jpg', 5, '2026-05-26'
),

-- Danh mục: Y Học Bệnh Cây (y_hoc_benh_cay)
(
  N'Cách chẩn đoán và xử lý thối nhũn lá ở những dòng phong lan, sen đá quý hiếm', 
  'y_hoc_benh_cay', 
  N'Bệnh thối nhũn do vi khuẩn Erwinia carotovora gây hoang mang cho mọi tín đồ yêu cây. Tìm hiểu phác đồ điều trị sinh học hiệu quả tận gốc...', 
  N'Hướng dẫn cô lập cây bệnh, kỹ thuật cắt bỏ mô thối bằng dụng cụ khử trùng và các bài thuốc phun xịt từ nước vôi trong hoặc chế phẩm sinh học chứa nấm đối kháng Tribac.', 
  'thoi-nhun-lan-sen.jpg', 5, '2026-04-28'
),
(
  N'Dấu hiệu thiếu hụt vi chất ở cây cảnh trong nhà và cách kê đơn chính xác', 
  'y_hoc_benh_cay', 
  N'Lá vàng gân xanh, cháy mép lá hay rụng chồi non? Đọc vị chính xác cây của bạn đang đói Nitơ, Kali hay Sắt để cứu cây kịp thời.', 
  N'Bảng tra cứu biểu hiện màu sắc lá theo từng loại dinh dưỡng bị thiếu và hướng dẫn cách bón phân qua lá, bổ sung vi lượng chelate giúp phục hồi bộ rễ nhanh chóng.', 
  'thieu-vi-chat-cay.jpg', 6, '2026-05-02'
),
(
  N'Tiêu diệt rệp sáp và nhện đỏ bằng dung dịch hữu cơ tự chế an toàn', 
  'y_hoc_benh_cay', 
  N'Nói không với hóa chất độc hại, bảo vệ sức khỏe gia đình bằng công thức nước xịt từ tỏi, ớt và nước rửa chén sinh học cực nhạy.', 
  N'Tỷ lệ pha chế chuẩn xác dung dịch tỏi ớt gừng, cơ chế phá hủy lớp vỏ sáp của côn trùng phá hoại và lịch trình phun xịt ngắt quãng để diệt sạch cả trứng rệp.', 
  'diet-rep-sap-organic.jpg', 5, '2026-05-10'
),
(
  N'Hội chứng nghẹt rễ ở cây trồng chậu lâu năm: Nguyên nhân và cách thay đất', 
  'y_hoc_benh_cay', 
  N'Khi rễ cây cuộn tròn khít chậu khiến cây còi cọc, bỏ lá. Tìm hiểu quy trình 5 bước đảo chậu, tỉa rễ và hồi sức cho cây sau sang chấn.', 
  N'Kỹ thuật gỡ bỏ giá thể cũ bết chặt, cách cắt tỉa bớt rễ già rễ mục, lựa chọn kích thước chậu mới phù hợp và sử dụng thuốc kích rễ n3m để cây nhanh bám đất mới.', 
  'nghet-re-thay-chau.jpg', 6, '2026-05-14'
);
select *from articles;
DROP TABLE IF EXISTS articles;
