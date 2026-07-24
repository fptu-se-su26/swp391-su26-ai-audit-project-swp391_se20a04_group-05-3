package com.greenlife.blog.repository.specification;

import com.greenlife.blog.entity.Blog;
import com.greenlife.blog.entity.enums.BlogStatus;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class BlogSpecificationsTest {

    @Test
    @SuppressWarnings("unchecked")
    void testHasStatusPendingReview() {
        // Arrange
        Root<Blog> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> currentRevisionPath = mock(Path.class);
        Path<Object> statusPath = mock(Path.class);
        Predicate expectedPredicate = mock(Predicate.class);

        when(root.get("currentRevision")).thenReturn(currentRevisionPath);
        when(currentRevisionPath.get("status")).thenReturn(statusPath);
        when(cb.equal(statusPath, BlogStatus.PENDING_REVIEW)).thenReturn(expectedPredicate);

        // Act
        Specification<Blog> spec = BlogSpecifications.hasStatus(BlogStatus.PENDING_REVIEW);
        Predicate actualPredicate = spec.toPredicate(root, query, cb);

        // Assert
        assertNotNull(actualPredicate);
        assertEquals(expectedPredicate, actualPredicate);
        verify(root).get("currentRevision");
        verify(currentRevisionPath).get("status");
        verify(cb).equal(statusPath, BlogStatus.PENDING_REVIEW);
    }

    @Test
    @SuppressWarnings("unchecked")
    void testHasStatusPublished() {
        // Arrange
        Root<Blog> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> statusPath = mock(Path.class);
        Predicate expectedPredicate = mock(Predicate.class);

        when(root.get("status")).thenReturn(statusPath);
        when(cb.equal(statusPath, BlogStatus.PUBLISHED)).thenReturn(expectedPredicate);

        // Act
        Specification<Blog> spec = BlogSpecifications.hasStatus(BlogStatus.PUBLISHED);
        Predicate actualPredicate = spec.toPredicate(root, query, cb);

        // Assert
        assertNotNull(actualPredicate);
        assertEquals(expectedPredicate, actualPredicate);
        verify(root).get("status");
        verify(cb).equal(statusPath, BlogStatus.PUBLISHED);
    }

    @Test
    @SuppressWarnings("unchecked")
    void testHasStatusNull() {
        // Arrange
        Root<Blog> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);

        // Act
        Specification<Blog> spec = BlogSpecifications.hasStatus(null);
        Predicate actualPredicate = spec.toPredicate(root, query, cb);

        // Assert
        assertNull(actualPredicate);
    }
}
