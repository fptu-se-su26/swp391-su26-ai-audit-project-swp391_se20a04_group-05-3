-- SQL Migration: patch_10_blog_indexes.sql
USE GreenLife;
GO

-- 1. Add Soft Delete and Concurrency Control Columns
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'blogs' AND COLUMN_NAME = 'deleted')
BEGIN
    ALTER TABLE blogs ADD deleted BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'blogs' AND COLUMN_NAME = 'version')
BEGIN
    ALTER TABLE blogs ADD version INT NOT NULL DEFAULT 0;
END
GO

-- 2. Create Performance Optimization Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('blogs') AND name = 'ix_blogs_author_id')
BEGIN
    CREATE INDEX ix_blogs_author_id ON blogs(author_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('blogs') AND name = 'ix_blogs_status')
BEGIN
    CREATE INDEX ix_blogs_status ON blogs(status);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('blogs') AND name = 'ix_blogs_category')
BEGIN
    CREATE INDEX ix_blogs_category ON blogs(category);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('blogs') AND name = 'ix_blogs_created_at')
BEGIN
    CREATE INDEX ix_blogs_created_at ON blogs(created_at);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('blogs') AND name = 'ix_blogs_slug')
BEGIN
    CREATE INDEX ix_blogs_slug ON blogs(slug);
END
GO
