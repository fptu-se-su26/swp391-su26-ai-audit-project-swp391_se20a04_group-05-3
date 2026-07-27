package com.greenlife.blog.repository;

import com.greenlife.blog.entity.BlogModerationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BlogModerationHistoryRepository extends JpaRepository<BlogModerationHistory, Integer> {
    
    @Query("SELECT h FROM BlogModerationHistory h WHERE h.blog.id = :blogId ORDER BY h.createdAt DESC")
    List<BlogModerationHistory> findByBlogIdOrderByCreatedAtDesc(@Param("blogId") Integer blogId);
}
