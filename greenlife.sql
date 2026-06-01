CREATE DATABASE Green;
GO
USE GreenLife;
GO
-- 1. ROLES — Vai trò người dùng
CREATE TABLE roles (
  id   INT PRIMARY KEY IDENTITY(1,1),
  name NVARCHAR(50) NOT NULL  -- 'CUSTOMER' | 'STORE' | 'ADMIN'
);


-- 2. USERS — Tài khoản người dùng
CREATE TABLE users (
  id            INT PRIMARY KEY IDENTITY(1,1),
  full_name     NVARCHAR(100) NOT NULL,
  email         NVARCHAR(100) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  role_id       INT NOT NULL FOREIGN KEY REFERENCES roles(id),
  status        NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | SUSPENDED
  created_at    DATETIME DEFAULT GETDATE()
);

-- 3. STORES — Hồ sơ cửa hàng
CREATE TABLE stores (
  id          INT PRIMARY KEY IDENTITY(1,1),
  owner_id    INT NOT NULL FOREIGN KEY REFERENCES users(id),
  name        NVARCHAR(150) NOT NULL,
  address     NVARCHAR(255) NOT NULL,
  city        NVARCHAR(100),
  phone       NVARCHAR(20),
  status      NVARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  created_at  DATETIME DEFAULT GETDATE()
);

-- 4. CATEGORIES — Danh mục cây trồng
CREATE TABLE categories (
  id         INT PRIMARY KEY IDENTITY(1,1),
  name       NVARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT GETDATE()
);

-- 5. PLANTS — Sản phẩm theo từng cửa hàng
CREATE TABLE plants (
  id          INT PRIMARY KEY IDENTITY(1,1),
  store_id    INT NOT NULL FOREIGN KEY REFERENCES stores(id),
  category_id INT FOREIGN KEY REFERENCES categories(id),
  name        NVARCHAR(150) NOT NULL,
  description NVARCHAR(MAX),
  price       DECIMAL(12,0) NOT NULL,
  stock       INT DEFAULT 0,
  image_url   NVARCHAR(255),
  status      NVARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE | INACTIVE
  created_at  DATETIME DEFAULT GETDATE()
);

-- 6. CART_ITEMS — Giỏ hàng
CREATE TABLE cart_items (
  id         INT PRIMARY KEY IDENTITY(1,1),
  customer_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
  plant_id    INT NOT NULL FOREIGN KEY REFERENCES plants(id),
  quantity    INT NOT NULL DEFAULT 1,
  added_at    DATETIME DEFAULT GETDATE()
);

-- 7. ORDERS — Đơn đặt hàng
CREATE TABLE orders (
  id              INT PRIMARY KEY IDENTITY(1,1),
  customer_id     INT NOT NULL FOREIGN KEY REFERENCES users(id),
  store_id        INT NOT NULL FOREIGN KEY REFERENCES stores(id),
  total_price     DECIMAL(12,0) NOT NULL,
  payment_method  NVARCHAR(30) NOT NULL, -- COD | BANK_TRANSFER | MOMO
  status          NVARCHAR(20) DEFAULT 'PENDING', -- PENDING | CONFIRMED | SHIPPING | DELIVERED | CANCELLED
  address         NVARCHAR(255) NOT NULL,
  created_at      DATETIME DEFAULT GETDATE()
);

-- 8. ORDER_DETAILS — Chi tiết đơn hàng
CREATE TABLE order_details (
  id         INT PRIMARY KEY IDENTITY(1,1),
  order_id   INT NOT NULL FOREIGN KEY REFERENCES orders(id),
  plant_id   INT NOT NULL FOREIGN KEY REFERENCES plants(id),
  quantity   INT NOT NULL,
  unit_price DECIMAL(12,0) NOT NULL
);

-- 9. SERVICES — Dịch vụ làm vườn
CREATE TABLE services (
  id          INT PRIMARY KEY IDENTITY(1,1),
  store_id    INT NOT NULL FOREIGN KEY REFERENCES stores(id),
  name        NVARCHAR(150) NOT NULL,
  description NVARCHAR(MAX),
  price       DECIMAL(12,0),
  duration    INT,  -- thời gian thực hiện (phút)
  status      NVARCHAR(20) DEFAULT 'ACTIVE',
  created_at  DATETIME DEFAULT GETDATE()
);

-- 10. BOOKINGS — Lịch hẹn dịch vụ
CREATE TABLE bookings (
  id           INT PRIMARY KEY IDENTITY(1,1),
  customer_id  INT NOT NULL FOREIGN KEY REFERENCES users(id),
  store_id     INT NOT NULL FOREIGN KEY REFERENCES stores(id),
  service_id   INT NOT NULL FOREIGN KEY REFERENCES services(id),
  booking_date DATETIME NOT NULL,
  address      NVARCHAR(255) NOT NULL,
  status       NVARCHAR(20) DEFAULT 'PENDING', -- PENDING | CONFIRMED | DONE
  created_at   DATETIME DEFAULT GETDATE()
);

-- 
-- 11. DIAGNOSIS_HISTORY — Chẩn đoán AI
CREATE TABLE diagnosis_history (
  id             INT PRIMARY KEY IDENTITY(1,1),
  customer_id    INT NOT NULL FOREIGN KEY REFERENCES users(id),
  image_url      NVARCHAR(255) NOT NULL,
  result         NVARCHAR(MAX),        -- Kết quả chẩn đoán
  recommendation NVARCHAR(MAX),        -- Khuyến nghị xử lý
  created_at     DATETIME DEFAULT GETDATE()
);

-- 12. BLOGS — Bài viết giáo dục
CREATE TABLE blogs (
  id         INT PRIMARY KEY IDENTITY(1,1),
  author_id  INT NOT NULL FOREIGN KEY REFERENCES users(id),
  title      NVARCHAR(200) NOT NULL,
  content    NVARCHAR(MAX),
  image_url  NVARCHAR(255),
  category   NVARCHAR(50), -- 'basic_care' | 'disease' | 'inspiration'
  created_at DATETIME DEFAULT GETDATE()
);

-- 13. REVIEWS — Đánh giá khách hàng
-- 
CREATE TABLE reviews (
  id          INT PRIMARY KEY IDENTITY(1,1),
  customer_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
  plant_id    INT NULL FOREIGN KEY REFERENCES plants(id),
  store_id    INT NULL FOREIGN KEY REFERENCES stores(id),
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  comment     NVARCHAR(MAX),
  created_at  DATETIME DEFAULT GETDATE()
);
-- Roles
INSERT INTO roles (name) VALUES ('ADMIN'), ('STORE'), ('CUSTOMER');

-- Users mẫu
INSERT INTO users (full_name, email, password_hash, role_id, status) VALUES
(N'Admin GreenLife',  'admin@greenlife.vn',   'hash_admin', 1, 'ACTIVE'),
(N'Cửa hàng Xanh',   'store1@greenlife.vn',  'hash_store', 2, 'ACTIVE'),
(N'Nguyễn Thị Lan',  'lan@gmail.com',         'hash_lan',   3, 'ACTIVE'),
(N'Trần Văn Minh',   'minh@gmail.com',        'hash_minh',  3, 'ACTIVE');

-- Stores mẫu
INSERT INTO stores (owner_id, name, address, city, phone, status) VALUES
(2, N'Cây Xanh Hải Phòng', N'123 Lê Lợi', N'Hải Phòng', '0901234567', 'APPROVED'),
(2, N'Garden House',        N'45 Trần Phú', N'Đà Nẵng',  '0912345678', 'APPROVED');

-- Categories mẫu
INSERT INTO categories (name) VALUES
(N'Cây trong nhà'), (N'Cây ngoài trời'),
(N'Thuỷ sinh'), (N'Bonsai'), (N'Phụ kiện');

-- Plants mẫu
INSERT INTO plants (store_id, category_id, name, price, stock, description) VALUES
(1, 1, N'Cây Kim Tiền',      85000,  50, N'Cây phong thuỷ, dễ chăm'),
(1, 1, N'Cây Lưỡi Hổ',     120000,  40, N'Lọc không khí tốt'),
(1, 2, N'Cây Hoa Lan',      250000,  20, N'Hoa đẹp, sang trọng'),
(2, 4, N'Bonsai Sanh Mini', 450000,  10, N'Dáng cổ thụ nghệ thuật'),
(2, 5, N'Chậu Gốm 20cm',    75000,  80, N'Men trắng sang trọng');

-- Services mẫu
INSERT INTO services (store_id, name, description, price, duration) VALUES
(1, N'Cắt tỉa cây tại nhà',    N'Dịch vụ cắt tỉa chuyên nghiệp', 150000, 60),
(1, N'Thiết kế tiểu cảnh',     N'Tư vấn và thiết kế sân vườn',   500000, 180),
(2, N'Chăm sóc cây định kỳ',   N'Tưới nước, bón phân hàng tuần', 200000, 90);INSERT INTO articles (title, category, summary, content, image_url, reading_time, created_at) VALUES

INSERT INTO blogs (author_id, title, category, content, image_url, created_at) VALUES

-- Danh mục: Nông Nghiệp Đô Thị
(
  1,
  N'Top loại thảo mộc cực dễ trồng chịu bóng râm tốt cho nhà phố',
  'nong_nghiep_do_thi',
  N'Bạc hà (mint) — dễ nhất cho người mới. Rất phù hợp để trông ở nhà phố vì chỉ cần ánh sáng gián tiếp là có thể sống được, mùi thơm mát và có thể đuổi được côn trùng nhẹ. Lưu ý: tưới ngày 1 lần sáng sớm, cắt ngọn thường xuyên để cây bụi hơn. Được dùng để pha trà bạc hà hoặc ăn kèm với bún.
  Húng quế — thơm, đa dụng. Thích ánh nắng nhẹ vào buổi sớm, chịu được bóng râm tốt. Lưu ý: không được để cây úng nước và phải thường xuyên bấm tỉa. Dùng để ăn kèm các loại rau thơm.
  Tía tô — rất hợp khí hậu nước ta. Chịu được bóng râm tốt, ít sâu bệnh, lá mọc nhanh. Lưu ý: tưới nước mỗi ngày 1 lần. Dùng để làm thuốc giải cảm rất tốt',
  'thao-moc-nha-pho.jpg',
  '2026-05-22'
),

-- Danh mục: Sống Xanh Thượng Lưu
(
  1,
  N'Bí mật đằng sau ''Eco-Score'' và lối sống giảm thiểu dấu chân Carbon',
  'song_xanh',
  N'Bài viết phân tích sâu về khái niệm dấu chân carbon của từng loại cây trồng, quy trình đóng gói bằng vật liệu tự hủy sinh học và cách ứng dụng tiêu chuẩn Eco-Score vào mua sắm.',
  'eco-score-secret.jpg',
  '2026-05-18'
),
(
  1,
  N'Nghệ thuật bài trí cây phong thủy Biophilic Design trong căn hộ Penthouse',
  'song_xanh',
  N'Cách kết hợp các mảng tường rêu tự nhiên, vị trí đặt các chậu Bonsai dáng đại thế vững chãi tại phòng khách và kỹ thuật giấu đèn quang phổ giả lập ánh sáng mặt trời.',
  'biophilic-penthouse.jpg',
  '2026-05-25'
),
(
  1,
  N'Liệu pháp Tắm Rừng (Shinrin-yoku) ngay tại không gian sân vườn gia đình',
  'song_xanh',
  N'Hướng dẫn cách quy hoạch một góc vườn thiền với âm thanh nước chảy, các tầng cây tạo ion âm như tùng bách, dương xỉ để tối ưu hóa không gian tĩnh tâm.',
  'shinrin-yoku-home.jpg',
  '2026-05-26'
),

-- Danh mục: Y Học Bệnh Cây
(
  1,
  N'Cách chẩn đoán và xử lý thối nhũn lá ở những dòng phong lan, sen đá quý hiếm',
  'y_hoc_benh_cay',
  N'Bệnh thối nhũn do vi khuẩn Erwinia carotovora gây hoang mang cho mọi tín đồ yêu cây. Tìm hiểu phác đồ điều trị sinh học hiệu quả tận gốc.',
  'thoi-nhun-lan-sen.jpg',
  '2026-04-28'
),
(
  1,
  N'Dấu hiệu thiếu hụt vi chất ở cây cảnh trong nhà và cách kê đơn chính xác',
  'y_hoc_benh_cay',
  N'Bảng tra cứu biểu hiện màu sắc lá theo từng loại dinh dưỡng bị thiếu và hướng dẫn cách bón phân qua lá, bổ sung vi lượng chelate giúp phục hồi bộ rễ nhanh chóng.',
  'thieu-vi-chat-cay.jpg',
  '2026-05-02'
),
(
  1,
  N'Tiêu diệt rệp sáp và nhện đỏ bằng dung dịch hữu cơ tự chế an toàn',
  'y_hoc_benh_cay',
  N'Tỷ lệ pha chế chuẩn xác dung dịch tỏi ớt gừng, cơ chế phá hủy lớp vỏ sáp của côn trùng phá hoại và lịch trình phun xịt ngắt quãng để diệt sạch cả trứng rệp.',
  'diet-rep-sap-organic.jpg',
  '2026-05-10'
),
(
  1,
  N'Hội chứng nghẹt rễ ở cây trồng chậu lâu năm: Nguyên nhân và cách thay đất',
  'y_hoc_benh_cay',
  N'Kỹ thuật gỡ bỏ giá thể cũ bết chặt, cách cắt tỉa bớt rễ già rễ mục, lựa chọn kích thước chậu mới phù hợp và sử dụng thuốc kích rễ n3m để cây nhanh bám đất mới.',
  'nghet-re-thay-chau.jpg',
  '2026-05-14'
);
