package com.greenlife.blog.repository.specification;

import com.greenlife.blog.entity.Blog;
import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class BlogSpecifications {

    @SuppressWarnings("null")
    public static Specification<Blog> fetchAuthor() {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("author", JoinType.LEFT);
                query.distinct(true);
            }
            return null;
        };
    }

    @SuppressWarnings("null")
    public static Specification<Blog> hasAuthor(Integer authorId) {
        return (root, query, cb) -> authorId == null ? null : cb.equal(root.get("author").get("id"), authorId);
    }

    @SuppressWarnings("null")
    public static Specification<Blog> hasCategory(BlogCategory category) {
        return (root, query, cb) -> category == null ? null : cb.equal(root.get("category"), category);
    }

    @SuppressWarnings("null")
    public static Specification<Blog> hasStatus(BlogStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return null;
            }
            if (status == BlogStatus.PENDING_REVIEW) {
                return cb.equal(root.get("currentRevision").get("status"), BlogStatus.PENDING_REVIEW);
            }
            return cb.equal(root.get("status"), status);
        };
    }

    @SuppressWarnings("null")
    public static Specification<Blog> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return null;
            }
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("summary")), pattern),
                    cb.like(cb.lower(root.get("content")), pattern));
        };
    }
}
