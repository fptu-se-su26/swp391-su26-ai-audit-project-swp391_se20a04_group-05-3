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
IF OBJECT_ID('order_return_evidence', 'U') IS NOT NULL DROP TABLE order_return_evidence;
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
    return_reject_reason NVARCHAR(500) NULL,
    return_request_reason NVARCHAR(500) NULL,
    return_request_reason_code NVARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores(id),
    CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND shipping_fee >= 0 AND total_amount >= 0),
    CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('COD', 'PAYOS', 'BANK_TRANSFER', 'MOMO', 'VNPAY')),
    CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED', 'FAILED')),
    CONSTRAINT chk_orders_status CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RECEIVED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED'))
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
-- 8b. Order return evidence
-- =========================================================
CREATE TABLE order_return_evidence (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_order_return_evidence_orders FOREIGN KEY (order_id) REFERENCES orders(id)
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
CREATE INDEX ix_order_return_evidence_order_id ON order_return_evidence(order_id);
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
-- =========================================================
INSERT INTO roles (name, description) VALUES
('ADMIN', N'Quản trị viên hệ thống'),
('STORE_OWNER', N'Chủ cửa hàng cây xanh'),
('CUSTOMER', N'Khách hàng mua cây và đặt dịch vụ');
GO

-- Production administrator is provisioned manually.
-- Do not store default administrator credentials in source control.
-- Existing Azure administrator: admin@greenlife.vn

INSERT INTO categories (name, slug, description) VALUES
(N'Cây trong nhà', 'cay-trong-nha', N'Cây phù hợp đặt trong phòng khách, văn phòng, căn hộ.'),
(N'Cây ngoài trời', 'cay-ngoai-troi', N'Cây phù hợp ban công, sân vườn, khuôn viên.'),
(N'Cây thủy sinh', 'cay-thuy-sinh', N'Cây dùng cho hồ cá và bể thủy sinh.'),
(N'Bonsai', 'bonsai', N'Cây cảnh nghệ thuật.'),
(N'Phụ kiện', 'phu-kien', N'Chậu, đất, phân bón, dụng cụ chăm cây.');
GO
