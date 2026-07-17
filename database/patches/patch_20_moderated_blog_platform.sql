-- SQL Patch: patch_20_moderated_blog_platform.sql
-- Date: 2026-07-15
-- Reason: Implement moderated blog revisions and moderation history

USE GreenLife;
GO

IF OBJECT_ID('blog_revisions', 'U') IS NULL
BEGIN
    CREATE TABLE blog_revisions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        blog_id INT NOT NULL,
        revision_number INT NOT NULL,
        title NVARCHAR(220) NOT NULL,
        summary NVARCHAR(500) NULL,
        content_html NVARCHAR(MAX) NULL,
        category VARCHAR(60) NOT NULL,
        image_url NVARCHAR(500) NULL,
        status VARCHAR(30) NOT NULL,
        source_type VARCHAR(30) NOT NULL,
        source_file_name NVARCHAR(255) NULL,
        reviewer_note NVARCHAR(1000) NULL,
        submitted_at DATETIME2 NULL,
        reviewed_at DATETIME2 NULL,
        reviewer_id INT NULL,
        created_by INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL,
        version INT NOT NULL DEFAULT 0,
        deleted BIT NOT NULL DEFAULT 0
    );
END
GO

IF OBJECT_ID('blog_moderation_history', 'U') IS NULL
BEGIN
    CREATE TABLE blog_moderation_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        blog_id INT NOT NULL,
        revision_id INT NULL,
        actor_user_id INT NOT NULL,
        action VARCHAR(30) NOT NULL,
        note NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- Add fields to blogs table for referencing revisions
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('blogs') AND name = 'published_revision_id')
BEGIN
    ALTER TABLE blogs ADD published_revision_id INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('blogs') AND name = 'current_revision_id')
BEGIN
    ALTER TABLE blogs ADD current_revision_id INT NULL;
END
GO

-- Backfill existing blogs into revisions table before enforcing constraints
IF EXISTS (SELECT * FROM blogs WHERE published_revision_id IS NULL AND current_revision_id IS NULL)
BEGIN
    DECLARE @blog_id INT, @author_id INT, @title NVARCHAR(220), @summary NVARCHAR(500), @content NVARCHAR(MAX),
            @category VARCHAR(60), @image_url NVARCHAR(500), @status VARCHAR(30), @created_at DATETIME2,
            @updated_at DATETIME2, @version INT, @deleted BIT;

    DECLARE blog_cursor CURSOR FOR
    SELECT id, author_id, title, summary, content, category, image_url, status, created_at, updated_at, version, deleted
    FROM blogs
    WHERE published_revision_id IS NULL AND current_revision_id IS NULL;

    OPEN blog_cursor;
    FETCH NEXT FROM blog_cursor INTO @blog_id, @author_id, @title, @summary, @content, @category, @image_url, @status, @created_at, @updated_at, @version, @deleted;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Insert revision
        INSERT INTO blog_revisions (blog_id, revision_number, title, summary, content_html, category, image_url, status, source_type, created_by, created_at, updated_at, version, deleted)
        VALUES (@blog_id, 1, @title, @summary, @content, @category, @image_url, @status, 'DIRECT', @author_id, @created_at, @updated_at, @version, @deleted);

        DECLARE @new_rev_id INT = SCOPE_IDENTITY();

        -- Update blog references
        IF @status = 'PUBLISHED'
        BEGIN
            UPDATE blogs 
            SET published_revision_id = @new_rev_id, current_revision_id = @new_rev_id
            WHERE id = @blog_id;
        END
        ELSE
        BEGIN
            UPDATE blogs 
            SET current_revision_id = @new_rev_id
            WHERE id = @blog_id;
        END

        FETCH NEXT FROM blog_cursor INTO @blog_id, @author_id, @title, @summary, @content, @category, @image_url, @status, @created_at, @updated_at, @version, @deleted;
    END

    CLOSE blog_cursor;
    DEALLOCATE blog_cursor;
END
GO

-- Add constraints to blog_revisions
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_revisions_blog')
BEGIN
    ALTER TABLE blog_revisions ADD CONSTRAINT fk_revisions_blog FOREIGN KEY (blog_id) REFERENCES blogs(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_revisions_reviewer')
BEGIN
    ALTER TABLE blog_revisions ADD CONSTRAINT fk_revisions_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_revisions_creator')
BEGIN
    ALTER TABLE blog_revisions ADD CONSTRAINT fk_revisions_creator FOREIGN KEY (created_by) REFERENCES users(id);
END
GO

-- Add constraints to blog_moderation_history
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_history_blog')
BEGIN
    ALTER TABLE blog_moderation_history ADD CONSTRAINT fk_history_blog FOREIGN KEY (blog_id) REFERENCES blogs(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_history_revision')
BEGIN
    ALTER TABLE blog_moderation_history ADD CONSTRAINT fk_history_revision FOREIGN KEY (revision_id) REFERENCES blog_revisions(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_history_actor')
BEGIN
    ALTER TABLE blog_moderation_history ADD CONSTRAINT fk_history_actor FOREIGN KEY (actor_user_id) REFERENCES users(id);
END
GO

-- Add constraints to blogs
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_blogs_published_revision')
BEGIN
    ALTER TABLE blogs ADD CONSTRAINT fk_blogs_published_revision FOREIGN KEY (published_revision_id) REFERENCES blog_revisions(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_blogs_current_revision')
BEGIN
    ALTER TABLE blogs ADD CONSTRAINT fk_blogs_current_revision FOREIGN KEY (current_revision_id) REFERENCES blog_revisions(id);
END
GO
