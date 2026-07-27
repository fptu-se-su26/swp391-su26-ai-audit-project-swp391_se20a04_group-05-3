-- SQL Patch: Create wishlist_items table
-- Date: 2026-06-18

USE GreenLife;
GO

IF OBJECT_ID('wishlist_items', 'U') IS NULL
BEGIN
    CREATE TABLE wishlist_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT NOT NULL,
        plant_id INT NOT NULL,
        added_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_wishlist_customer FOREIGN KEY (customer_id) REFERENCES users(id),
        CONSTRAINT fk_wishlist_plant FOREIGN KEY (plant_id) REFERENCES plants(id),
        CONSTRAINT uq_wishlist_customer_plant UNIQUE (customer_id, plant_id)
    );

    CREATE INDEX ix_wishlist_customer_id ON wishlist_items(customer_id);
    CREATE INDEX ix_wishlist_plant_id ON wishlist_items(plant_id);
END
GO
