-- GreenLife professional backend schema for SQL Server
-- Target stack: Spring Boot + Spring Security + JWT + Spring Data JPA + SQL Server
-- Run in SQL Server Management Studio during development.

IF DB_ID(N'GreenLife') IS NULL
BEGIN
    CREATE DATABASE GreenLife;
END
GO

USE GreenLife;
GO

-- =========================================================
-- Development reset
-- Drop tables in dependency order.
-- Remove this block later if you need to preserve production data.
-- =========================================================
IF OBJECT_ID('reviews', 'U') IS NOT NULL DROP TABLE reviews;
IF OBJECT_ID('blogs', 'U') IS NOT NULL DROP TABLE blogs;
IF OBJECT_ID('diagnosis_history', 'U') IS NOT NULL DROP TABLE diagnosis_history;
IF OBJECT_ID('bookings', 'U') IS NOT NULL DROP TABLE bookings;
IF OBJECT_ID('services', 'U') IS NOT NULL DROP TABLE services;
IF OBJECT_ID('order_details', 'U') IS NOT NULL DROP TABLE order_details;
IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID('cart_items', 'U') IS NOT NULL DROP TABLE cart_items;
IF OBJECT_ID('plants', 'U') IS NOT NULL DROP TABLE plants;
IF OBJECT_ID('categories', 'U') IS NOT NULL DROP TABLE categories;
IF OBJECT_ID('stores', 'U') IS NOT NULL DROP TABLE stores;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('roles', 'U') IS NOT NULL DROP TABLE roles;
GO

-- =========================================================
-- 1. Roles
-- =========================================================
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_roles_name CHECK (name IN ('ADMIN', 'STORE_OWNER', 'CUSTOMER'))
);
GO

-- =========================================================
-- 2. Users
-- password_hash must be a BCrypt hash created by the backend.
-- =========================================================
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    address NVARCHAR(255) NULL,
    avatar_url NVARCHAR(500) NULL,
    role_id INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    email_verified BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'PENDING_APPROVAL'))
);
GO

-- =========================================================
-- 3. Stores
-- Each STORE_OWNER can own one or many stores.
-- Admin approves stores through status.
-- =========================================================
CREATE TABLE stores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    owner_id INT NOT NULL,
    name NVARCHAR(150) NOT NULL,
    phone VARCHAR(20) NULL,
    city NVARCHAR(100) NULL,
    district NVARCHAR(100) NULL,
    address NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    logo_url NVARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT chk_stores_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'))
);
GO

-- =========================================================
-- 4. Categories
-- Slug is useful for frontend routes and SEO-friendly URLs.
-- =========================================================
CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL
);
GO

-- =========================================================
-- 5. Plants
-- Product data belongs to a store.
-- Slug is unique inside each store.
-- =========================================================
CREATE TABLE plants (
    id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT NOT NULL,
    category_id INT NULL,
    name NVARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    description NVARCHAR(MAX) NULL,
    price DECIMAL(12,0) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url NVARCHAR(500) NULL,
    care_level NVARCHAR(50) NULL,
    sunlight NVARCHAR(100) NULL,
    water_level NVARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_plants_store FOREIGN KEY (store_id) REFERENCES stores(id),
    CONSTRAINT fk_plants_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT uq_plants_store_slug UNIQUE (store_id, slug),
    CONSTRAINT chk_plants_price CHECK (price >= 0),
    CONSTRAINT chk_plants_stock CHECK (stock >= 0),
    CONSTRAINT chk_plants_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'))
);
GO

-- =========================================================
-- 6. Cart items
-- One customer should not have duplicate cart lines for the same plant.
-- =========================================================
CREATE TABLE cart_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    plant_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_cart_items_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_cart_items_plant FOREIGN KEY (plant_id) REFERENCES plants(id),
    CONSTRAINT uq_cart_customer_plant UNIQUE (customer_id, plant_id),
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0)
);
GO

-- =========================================================
-- 7. Orders
-- This design keeps one order per store.
-- For multi-store checkout, backend can create multiple orders.
-- =========================================================
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    store_id INT NOT NULL,
    recipient_name NVARCHAR(120) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    shipping_address NVARCHAR(255) NOT NULL,
    subtotal DECIMAL(12,0) NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(12,0) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,0) NOT NULL DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'COD',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    note NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores(id),
    CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND shipping_fee >= 0 AND total_amount >= 0),
    CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY')),
    CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED', 'FAILED')),
    CONSTRAINT chk_orders_status CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'))
);
GO

-- =========================================================
-- 8. Order details
-- Keep product_name and unit_price snapshots so old orders stay correct
-- even if the plant name or price changes later.
-- =========================================================
CREATE TABLE order_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    plant_id INT NOT NULL,
    product_name NVARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,0) NOT NULL,
    line_total DECIMAL(12,0) NOT NULL,
    CONSTRAINT fk_order_details_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_details_plant FOREIGN KEY (plant_id) REFERENCES plants(id),
    CONSTRAINT chk_order_details_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_details_price CHECK (unit_price >= 0 AND line_total >= 0)
);
GO

-- =========================================================
-- 9. Services
-- Store owners can publish plant care services.
-- =========================================================
CREATE TABLE services (
    id INT IDENTITY(1,1) PRIMARY KEY,
    store_id INT NOT NULL,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    price DECIMAL(12,0) NOT NULL DEFAULT 0,
    duration_minutes INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_services_store FOREIGN KEY (store_id) REFERENCES stores(id),
    CONSTRAINT chk_services_price CHECK (price >= 0),
    CONSTRAINT chk_services_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT chk_services_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
GO

-- =========================================================
-- 10. Bookings
-- Booking for in-home plant care services.
-- =========================================================
CREATE TABLE bookings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    store_id INT NOT NULL,
    service_id INT NOT NULL,
    scheduled_at DATETIME2 NOT NULL,
    service_address NVARCHAR(255) NOT NULL,
    customer_note NVARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    cancel_reason NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_store FOREIGN KEY (store_id) REFERENCES stores(id),
    CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id),
    CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED'))
);
GO

-- =========================================================
-- 11. Diagnosis history
-- Stores AI diagnosis output for customer history.
-- =========================================================
CREATE TABLE diagnosis_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    plant_id INT NULL,
    image_url NVARCHAR(500) NOT NULL,
    disease_name NVARCHAR(150) NULL,
    confidence_score DECIMAL(5,2) NULL,
    severity VARCHAR(30) NULL,
    result NVARCHAR(MAX) NULL,
    recommendation NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_diagnosis_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_diagnosis_plant FOREIGN KEY (plant_id) REFERENCES plants(id),
    CONSTRAINT chk_diagnosis_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
    CONSTRAINT chk_diagnosis_severity CHECK (severity IS NULL OR severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);
GO

-- =========================================================
-- 12. Blogs
-- Educational content managed by admin or authorized users.
-- =========================================================
CREATE TABLE blogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    author_id INT NOT NULL,
    title NVARCHAR(220) NOT NULL,
    slug VARCHAR(240) NOT NULL UNIQUE,
    category VARCHAR(60) NOT NULL,
    summary NVARCHAR(500) NULL,
    content NVARCHAR(MAX) NULL,
    image_url NVARCHAR(500) NULL,
    reading_time INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
    published_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT chk_blogs_reading_time CHECK (reading_time IS NULL OR reading_time > 0),
    CONSTRAINT chk_blogs_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT chk_blogs_category CHECK (category IN ('BASIC_CARE', 'DISEASE', 'INSPIRATION', 'URBAN_FARMING', 'GREEN_LIVING'))
);
GO

-- =========================================================
-- 13. Reviews
-- A review can target a plant or a store.
-- =========================================================
CREATE TABLE reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    plant_id INT NULL,
    store_id INT NULL,
    rating INT NOT NULL,
    comment NVARCHAR(MAX) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'VISIBLE',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_reviews_plant FOREIGN KEY (plant_id) REFERENCES plants(id),
    CONSTRAINT fk_reviews_store FOREIGN KEY (store_id) REFERENCES stores(id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_target CHECK (plant_id IS NOT NULL OR store_id IS NOT NULL),
    CONSTRAINT chk_reviews_status CHECK (status IN ('VISIBLE', 'HIDDEN'))
);
GO

-- =========================================================
-- Indexes for backend queries
-- =========================================================
CREATE INDEX ix_users_role_id ON users(role_id);
CREATE INDEX ix_stores_owner_id ON stores(owner_id);
CREATE INDEX ix_stores_status ON stores(status);
CREATE INDEX ix_plants_store_id ON plants(store_id);
CREATE INDEX ix_plants_category_id ON plants(category_id);
CREATE INDEX ix_plants_status ON plants(status);
CREATE INDEX ix_orders_customer_id ON orders(customer_id);
CREATE INDEX ix_orders_store_id ON orders(store_id);
CREATE INDEX ix_orders_status ON orders(status);
CREATE INDEX ix_bookings_customer_id ON bookings(customer_id);
CREATE INDEX ix_bookings_store_id ON bookings(store_id);
CREATE INDEX ix_bookings_status ON bookings(status);
CREATE INDEX ix_blogs_category ON blogs(category);
CREATE INDEX ix_blogs_status ON blogs(status);
CREATE INDEX ix_reviews_plant_id ON reviews(plant_id);
CREATE INDEX ix_reviews_store_id ON reviews(store_id);
GO

-- =========================================================
-- Seed data
-- Password note:
-- Replace DEMO_BCRYPT_HASH with BCrypt hashes generated by Spring Security.
-- Recommended demo password: 123456
-- =========================================================
INSERT INTO roles (name, description) VALUES
('ADMIN', N'Quản trị viên hệ thống'),
('STORE_OWNER', N'Chủ cửa hàng cây xanh'),
('CUSTOMER', N'Khách hàng mua cây và đặt dịch vụ');
GO

INSERT INTO users (full_name, email, password_hash, phone, address, role_id, status, email_verified) VALUES
(N'Admin GreenLife', 'admin@greenlife.vn', 'DEMO_BCRYPT_HASH', '0901234567', N'Đà Nẵng', 1, 'ACTIVE', 1),
(N'Cửa hàng Xanh Đà Nẵng', 'store@greenlife.vn', 'DEMO_BCRYPT_HASH', '0912345678', N'123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 2, 'ACTIVE', 1),
(N'Nguyễn Thị Lan', 'lan@gmail.com', 'DEMO_BCRYPT_HASH', '0923456789', N'Hải Châu, Đà Nẵng', 3, 'ACTIVE', 1),
(N'Trần Văn Minh', 'minh@gmail.com', 'DEMO_BCRYPT_HASH', '0934567890', N'Sơn Trà, Đà Nẵng', 3, 'ACTIVE', 1);
GO

INSERT INTO stores (owner_id, name, phone, city, district, address, description, logo_url, status) VALUES
(2, N'Cây Xanh Đà Nẵng', '0912345678', N'Đà Nẵng', N'Hải Châu', N'123 Nguyễn Văn Linh', N'Cửa hàng cây cảnh và dịch vụ chăm sóc cây tại Đà Nẵng.', 'store-da-nang.png', 'APPROVED'),
(2, N'Garden House Sơn Trà', '0912345679', N'Đà Nẵng', N'Sơn Trà', N'45 Võ Văn Kiệt', N'Cửa hàng cây xanh chuyên cây trong nhà và dịch vụ bảo dưỡng.', 'garden-house.png', 'APPROVED');
GO

INSERT INTO categories (name, slug, description) VALUES
(N'Cây trong nhà', 'cay-trong-nha', N'Cây phù hợp đặt trong phòng khách, văn phòng, căn hộ.'),
(N'Cây ngoài trời', 'cay-ngoai-troi', N'Cây phù hợp ban công, sân vườn, khuôn viên.'),
(N'Cây thủy sinh', 'cay-thuy-sinh', N'Cây dùng cho hồ cá và bể thủy sinh.'),
(N'Bonsai', 'bonsai', N'Cây cảnh nghệ thuật.'),
(N'Phụ kiện', 'phu-kien', N'Chậu, đất, phân bón, dụng cụ chăm cây.');
GO

INSERT INTO plants (store_id, category_id, name, slug, price, stock, image_url, description, care_level, sunlight, water_level, status) VALUES
(1, 1, N'Cây Kim Tiền', 'cay-kim-tien', 85000, 50, 'kim-tien.jpg', N'Cây phong thủy, dễ chăm, hợp để bàn làm việc.', N'Dễ', N'Ánh sáng gián tiếp', N'Tưới ít', 'ACTIVE'),
(1, 1, N'Cây Lưỡi Hổ', 'cay-luoi-ho', 120000, 40, 'luoi-ho.jpg', N'Cây lọc không khí tốt, chịu bóng râm.', N'Dễ', N'Bóng râm', N'Tưới ít', 'ACTIVE'),
(1, 2, N'Cây Hoa Lan', 'cay-hoa-lan', 250000, 20, 'lan.jpg', N'Hoa đẹp, sang trọng, thích hợp làm quà tặng.', N'Trung bình', N'Ánh sáng nhẹ', N'Tưới vừa', 'ACTIVE'),
(2, 4, N'Bonsai Sanh Mini', 'bonsai-sanh-mini', 450000, 10, 'bonsai-sanh.jpg', N'Bonsai mini nghệ thuật, dáng cổ thụ.', N'Khó', N'Ánh sáng mạnh', N'Tưới vừa', 'ACTIVE'),
(2, 5, N'Chậu Gốm 20cm', 'chau-gom-20cm', 75000, 80, 'chau-gom-20.jpg', N'Chậu gốm men trắng sang trọng.', N'Dễ', N'Không yêu cầu', N'Không yêu cầu', 'ACTIVE');
GO

INSERT INTO services (store_id, name, description, price, duration_minutes, status) VALUES
(1, N'Cắt tỉa cây tại nhà', N'Dịch vụ cắt tỉa cây cảnh chuyên nghiệp tại nhà.', 150000, 60, 'ACTIVE'),
(1, N'Thiết kế tiểu cảnh', N'Tư vấn và thiết kế tiểu cảnh ban công, sân vườn.', 500000, 180, 'ACTIVE'),
(2, N'Chăm sóc cây định kỳ', N'Tưới nước, bón phân, thay đất và kiểm tra sâu bệnh định kỳ.', 200000, 90, 'ACTIVE');
GO

INSERT INTO blogs (author_id, title, slug, category, summary, content, image_url, reading_time, status, published_at) VALUES
(1, N'Top loại thảo mộc dễ trồng cho nhà phố', 'top-thao-moc-de-trong-cho-nha-pho', 'URBAN_FARMING', N'Gợi ý các loại thảo mộc dễ trồng trong không gian nhà phố.', N'Bạc hà, húng quế và tía tô là những loại cây dễ trồng, phù hợp với nhà phố và ít cần chăm sóc phức tạp.', 'thao-moc-nha-pho.jpg', 5, 'PUBLISHED', SYSDATETIME()),
(1, N'Bí mật đằng sau Eco-Score và lối sống xanh', 'eco-score-va-loi-song-xanh', 'GREEN_LIVING', N'Tìm hiểu cách giảm dấu chân carbon trong chăm sóc cây.', N'Bài viết phân tích khái niệm Eco-Score, vật liệu tự hủy sinh học và thói quen mua sắm xanh.', 'eco-score-secret.jpg', 6, 'PUBLISHED', SYSDATETIME()),
(1, N'Cách chẩn đoán và xử lý thối nhũn lá', 'chan-doan-va-xu-ly-thoi-nhun-la', 'DISEASE', N'Dấu hiệu và hướng xử lý bệnh thối nhũn lá ở cây cảnh.', N'Bệnh thối nhũn thường do vi khuẩn hoặc tưới quá nhiều nước. Cần cách ly cây, cắt bỏ lá hư và thay giá thể phù hợp.', 'thoi-nhun-la.jpg', 7, 'PUBLISHED', SYSDATETIME()),
(1, N'Dấu hiệu thiếu vi chất ở cây cảnh trong nhà', 'dau-hieu-thieu-vi-chat-o-cay-canh', 'BASIC_CARE', N'Cách nhận biết cây thiếu dinh dưỡng và hướng bổ sung phù hợp.', N'Màu sắc lá, tốc độ phát triển và tình trạng rễ là những dấu hiệu quan trọng để nhận biết cây đang thiếu vi chất.', 'thieu-vi-chat-cay.jpg', 6, 'PUBLISHED', SYSDATETIME());
GO

INSERT INTO reviews (customer_id, plant_id, store_id, rating, comment, status) VALUES
(3, 1, NULL, 5, N'Cây khỏe, giao nhanh, đóng gói cẩn thận.', 'VISIBLE'),
(4, 2, NULL, 4, N'Cây đẹp, phù hợp để bàn làm việc.', 'VISIBLE'),
(3, NULL, 1, 5, N'Cửa hàng tư vấn nhiệt tình.', 'VISIBLE');
GO
