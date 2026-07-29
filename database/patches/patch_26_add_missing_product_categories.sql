-- SQL Patch 26: Add missing product categories (phan-bon, thiet-bi-thong-minh)
-- This patch is safe to run more than once on Microsoft Azure SQL Database.

SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
BEGIN
    THROW 50000, N'Table dbo.categories does not exist in the selected database.', 1;
END;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM dbo.categories WHERE slug = 'phan-bon')
    BEGIN
        INSERT INTO dbo.categories (name, slug, description)
        VALUES (N'Phân bón & dinh dưỡng', 'phan-bon', N'Phân bón hữu cơ, dung dịch thủy canh và sản phẩm dinh dưỡng cây trồng.');
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.categories WHERE slug = 'thiet-bi-thong-minh')
    BEGIN
        INSERT INTO dbo.categories (name, slug, description)
        VALUES (N'Thiết bị thông minh', 'thiet-bi-thong-minh', N'Cảm biến và thiết bị IoT hỗ trợ chăm sóc cây thông minh.');
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;
    THROW;
END CATCH;
GO
