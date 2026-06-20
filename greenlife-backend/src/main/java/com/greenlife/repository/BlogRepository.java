package com.greenlife.repository;

import com.greenlife.entity.Blog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface BlogRepository extends JpaRepository<Blog, Integer>, JpaSpecificationExecutor<Blog> {

    @Query(value = "SELECT COUNT(*) FROM blogs WHERE slug = :slug", nativeQuery = true)
    int countBySlugIncludingDeleted(@Param("slug") String slug);

    @Override
    @EntityGraph(attributePaths = {"author"})
    Optional<Blog> findById(Integer id);

    @EntityGraph(attributePaths = {"author"})
    Optional<Blog> findBySlug(String slug);
}
