package com.greenlife.blog.repository;

import com.greenlife.blog.entity.BlogRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BlogRevisionRepository extends JpaRepository<BlogRevision, Integer>, JpaSpecificationExecutor<BlogRevision> {
    
    @Query("SELECT r FROM BlogRevision r WHERE r.blog.id = :blogId AND r.deleted = false ORDER BY r.revisionNumber DESC")
    List<BlogRevision> findByBlogIdOrderByRevisionNumberDesc(@Param("blogId") Integer blogId);
    
    @Query("SELECT r FROM BlogRevision r WHERE r.blog.id = :blogId AND r.status = 'DRAFT' AND r.deleted = false")
    Optional<BlogRevision> findActiveDraftByBlogId(@Param("blogId") Integer blogId);
}
