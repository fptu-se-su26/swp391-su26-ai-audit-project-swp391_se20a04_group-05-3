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
  id         INT PRIMARY KEY IDENTITY(1,1),
  title      NVARCHAR(200),
  category   NVARCHAR(30),   -- 'disease_signs' | 'basic_care' | 'inspiration'
  content    NVARCHAR(MAX),
  image_url  NVARCHAR(255),
  created_at DATETIME DEFAULT GETDATE()
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
SELECT * FROM plant_groups;